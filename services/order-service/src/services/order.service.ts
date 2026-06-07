import crypto from "crypto";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  OrderResponse,
  OrderStatus,
  TicketTypeCatalogItem,
} from "../types/order.types.js";
import { OrderRepository } from "../repository/order.repository.js";
import { ConcertClient } from "../utils/concert.client.js";
import { paymentQueue } from "../queues/payment.queue.js";
import { orderQueue } from "../queues/order.queue.js";
import { redis } from "../infrastructure/redis.client.js";
import { releaseStockLua, reserveStockLua } from "../utils/stock.lua.js";
import { PaymentClient } from "../utils/payment.client.js";

const PAYMENT_WINDOW_MINUTES = 10;
const IDEMPOTENCY_TTL_SECONDS = 60 * 60;
const RESERVATION_TTL_SECONDS = 15 * 60;

const idempotencyKey = (key: string) => `order:idempotency:${key}`;
const concertStockKey = (concertId: string) => `catalog:concert:${concertId}:stock`;
const userPurchasedKey = (userId: string, concertId: string, ticketTypeId: string) =>
  `order:user:${userId}:concert:${concertId}:ticket_type:${ticketTypeId}:purchased`;

const toPaymentDeadline = () =>
  new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();

const getIdempotencyRecord = async (key: string) => {
  try {
    const payload = await redis.get(idempotencyKey(key));
    console.log("Idempotency record for key", key, ":", payload);
    return payload ? (JSON.parse(payload) as { status: string; response?: OrderResponse }) : null;
  } catch {
    return null;
  }
};

const setIdempotencyRecord = async (key: string, payload: unknown) => {
  console.log("Setting idempotency record for key", key, "with payload:", payload);
  // await redis.set(idempotencyKey(key), JSON.stringify(payload), "EX", IDEMPOTENCY_TTL_SECONDS);
};

const deleteIdempotencyRecord = async (key: string) => {
  await redis.del(idempotencyKey(key));
};

const ensureConcertCache = async (concertId: string) => {
  const stockKey = concertStockKey(concertId);
  const hashExists = await redis.exists(stockKey);

  const tickets = await ConcertClient.getConcertTickets(concertId);

  console.log("Fetched ticket types for concert", concertId, ":", tickets);
  if (hashExists === 0) {
    const stock = await ConcertClient.getConcertStock(concertId);
    console.log("Stock data for concert:", stock);
    const seed: Record<string, string> = {};

    for (const item of stock.ticketTypes) {
      seed[item.id] = String(item.stock);
    }

    if (Object.keys(seed).length > 0) {
      await redis.hset(stockKey, seed);
      await redis.expire(stockKey, RESERVATION_TTL_SECONDS);
    }
  }

  return tickets.ticketTypes;
};

const validateSingleConcert = (items: CreateOrderItemInput[]) => {
  const concertIds = new Set(items.map((item) => item.concertId));

  if (concertIds.size !== 1) {
    throw new AppError("All ticket items must belong to the same concert", 400);
  }

  return items[0]?.concertId;
};

const buildCatalogMap = (items: TicketTypeCatalogItem[]) => {
  return new Map(items.map((item) => [item.id, item]));
};

const reserveStocks = async (
  userId: string,
  concertId: string,
  items: CreateOrderItemInput[],
  catalogMap: Map<string, TicketTypeCatalogItem>,
) => {
  console.log("Reserving stock for order. User:", userId, "Concert:", concertId, "Items:", items);
  console.log("Current catalog map:", catalogMap);
  // return null; // --- IGNORE ---
  const keys: string[] = [];
  const args: string[] = [String(items.length)];

  for (const item of items) {
    const catalogItem = catalogMap.get(item.ticketTypeId);
    if (!catalogItem) {
      throw new AppError("Ticket type not found", 404);
    }

    keys.push(concertStockKey(concertId), userPurchasedKey(userId, concertId, item.ticketTypeId));
    args.push(item.ticketTypeId, String(item.quantity), String(catalogItem.maxPerUser));
  }

  const result = (await redis.eval(reserveStockLua, keys.length, ...keys, ...args)) as
    | Array<string>
    | string;
  const normalized = Array.isArray(result) ? result[0] : result;

  if (normalized !== "SUCCESS") {
    throw new AppError("Vé đã hết hoặc vượt quá giới hạn mua", 400);
  }
};

const rollbackStocks = async (userId: string, concertId: string, items: CreateOrderItemInput[]) => {
  const keys: string[] = [];
  const args: string[] = [String(items.length)];

  for (const item of items) {
    keys.push(concertStockKey(concertId), userPurchasedKey(userId, concertId, item.ticketTypeId));
    args.push(item.ticketTypeId, String(item.quantity), "0");
  }

  await redis.eval(releaseStockLua, keys.length, ...keys, ...args);
};

//------------------------------------------------------------------------------

export const OrderService = {
  /**
   * Creates a new order.
   * @param userId user ID of the order creator
   * @param incoming order creation request payload
   * @param idempotencyKeyValue idempotency key for ensuring idempotent requests
   * @returns A promise resolving to the created order response
   */
  async createOrder(
    userId: string,
    incoming: CreateOrderInput,
    idempotencyKeyValue: string,
  ): Promise<OrderResponse> {
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const requestItems = incoming.data;

    const concertId = validateSingleConcert(requestItems);
    const existingRecord = await getIdempotencyRecord(idempotencyKeyValue);

    if (existingRecord?.status === "PROCESSING") {
      throw new AppError("Order is already being processed", 409);
    }

    if (existingRecord?.status === "COMPLETED" && existingRecord.response) {
      return existingRecord.response;
    }

    if (!concertId) {
      throw new AppError("Concert ID is required", 400);
    }

    await setIdempotencyRecord(idempotencyKeyValue, { status: "PROCESSING" });

    const catalog = await ensureConcertCache(concertId);

    const catalogMap = buildCatalogMap(catalog);
    // console.log("Catalog map for concert", concertId, ":", catalogMap);
    const orderId = crypto.randomUUID();

    const totalPrice = requestItems.reduce((sum, item) => {
      const catalogItem = catalogMap.get(item.ticketTypeId);
      if (!catalogItem) {
        throw new AppError("Ticket type not found", 404);
      }
      return sum + catalogItem.price * item.quantity;
    }, 0);

    console.log("Total price for order:", totalPrice);

    await reserveStocks(userId, concertId, requestItems, catalogMap);

    // return { order_id: "dummy", total_price: 0, payment_deadline: toPaymentDeadline() }; // --- IGNORE ---
    try {
      await db.transaction(async (trx) => {
        await OrderRepository.createOrder(trx, {
          id: orderId,
          userId,
          idempotencyKey: idempotencyKeyValue,
          totalAmount: totalPrice,
          status: "pending",
        });

        await OrderRepository.createOrderItems(
          trx,
          orderId,
          requestItems.map((item) => ({
            concertId: item.concertId,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: catalogMap.get(item.ticketTypeId)?.price ?? 0,
          })),
        );
      });

      const response: OrderResponse = {
        order_id: orderId,
        total_price: totalPrice,
        payment_deadline: toPaymentDeadline(),
      };

      // await paymentQueue.add("PENDING_PAYMENT", {
      //   order_id: orderId,
      //   user_id: userId,
      //   idempotency_key: idempotencyKeyValue,
      //   amount: totalPrice,
      //   concert_id: concertId,
      //   items: requestItems,
      // });

      await orderQueue.add(
        "CLEANUP_EXPIRED_ORDER",
        {
          order_id: orderId,
          user_id: userId,
        },
        {
          delay: PAYMENT_WINDOW_MINUTES * 60 * 1000,
          jobId: `cleanup-${orderId}`,
        },
      );

      const payment = await PaymentClient.createPayment({
        orderId,
        userId,
        amount: totalPrice,
        paymentMethod: incoming.paymentMethod,
        idempotencyKey: idempotencyKeyValue,
      });

      await setIdempotencyRecord(idempotencyKeyValue, {
        status: "COMPLETED",
        response,
      });

      return response;
    } catch (error) {
      await OrderRepository.updateStatus(orderId, "failed");
      await rollbackStocks(userId, concertId, requestItems);
      await deleteIdempotencyRecord(idempotencyKeyValue);
      console.error("Error creating order:", error);
      throw new AppError("Failed to create order", 500);
    }
  },

  async listOrders({
    page,
    limit,
    status,
    concertId,
    userId,
  }: {
    page: number;
    limit: number;
    status?: OrderStatus | undefined;
    concertId?: string | undefined;
    userId?: string | undefined;
  }) {
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await OrderRepository.listOrders({ page, limit, status, concertId, userId });

    return {
      data: result.rows,
      pagination: {
        current_page: page,
        total_pages: Math.max(1, Math.ceil(result.totalItems / limit)),
        total_items: result.totalItems,
      },
    };
  },

  async handleExpiredOrder(orderId: string) {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.status !== "pending") {
      return { ignored: true };
    }

    const items = await OrderRepository.findOrderItems(orderId);
    await OrderRepository.updateStatus(orderId, "expired");

    const redisItems = items.map((item) => ({
      concertId: item.concertId,
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
      price: 0,
      maxPerUser: 0,
    })) as CreateOrderItemInput[];

    await rollbackStocks(order.userId, items[0]?.concertId ?? "", redisItems);

    return { ignored: false };
  },
};
