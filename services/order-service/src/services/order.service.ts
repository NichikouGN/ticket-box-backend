import crypto from "crypto";
import db from "../db/knex.js";
import { AppError } from "../types/appError.types.js";
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  OrderResponse,
  TicketTypeCatalogItem,
} from "../types/order.types.js";
import { OrderRepository } from "../repository/order.repository.js";
import { ConcertClient } from "../utils/concert.client.js";
import { orderQueue } from "../queues/order.queue.js";
import { redis } from "../infrastructure/redis.client.js";
import { reserveStockLua, releaseStockLua } from "../utils/stock.lua.js";
import { paymentQueue } from "../queues/payment.queue.js";
import { PaymentRepository } from "../repository/payment.repository.js";

const PAYMENT_WINDOW_MINUTES = 10;
const IDEMPOTENCY_TTL_SECONDS = 60 * 60;
const RESERVATION_TTL_SECONDS = 15 * 60;

// ---------------- Redis Keys ----------------
const idempotencyKey = (key: string) => `order:idempotency:${key}`;
const concertStockKey = (concertId: string) => `catalog:concert:${concertId}:stock`;
const userPurchasedKey = (userId: string, concertId: string, ticketTypeId: string) =>
  `order:user:${userId}:concert:${concertId}:ticket_type:${ticketTypeId}:purchased`;

// ---------------- Helper Functions ----------------
const toPaymentDeadline = () =>
  new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();

const getIdempotencyRecord = async (key: string) => {
  try {
    const payload = await redis.get(idempotencyKey(key));
    return payload ? (JSON.parse(payload) as { status: string; response?: OrderResponse }) : null;
  } catch {
    return null;
  }
};

const setIdempotencyRecord = async (key: string, payload: unknown) => {
  console.log("Setting idempotency record for key", key, "with payload:", payload);
  await redis.set(idempotencyKey(key), JSON.stringify(payload), "EX", IDEMPOTENCY_TTL_SECONDS);
};

const deleteIdempotencyRecord = async (key: string) => {
  console.log("Deleting idempotency record for key", key);
  await redis.del(idempotencyKey(key));
};

const ensureConcertCache = async (concertId: string) => {
  const stockKey = concertStockKey(concertId);
  const hashExists = await redis.exists(stockKey);

  const tickets = await ConcertClient.getConcertTickets(concertId);

  console.log("Fetched ticket types for concert", concertId, ":", tickets);
  if (hashExists === 0) {
    await ConcertClient.getConcertStock(concertId);
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

/**
 * Reserves stock for the specified ticket items by executing a Lua script in Redis to ensure atomicity. It checks the availability of the requested ticket quantities and updates the stock accordingly. If the reservation is successful, it returns without error; otherwise, it throws an AppError indicating that the tickets are sold out or exceed purchase limits.
 * @param userId ID of the user making the reservation
 * @param concertId ID of the concert for which tickets are being reserved
 * @param items List of ticket items to reserve
 * @param catalogMap Map of ticket types for the concert
 * @throws AppError if the reservation fails due to sold-out tickets or exceeding purchase limits
 */
const reserveStocks = async (
  userId: string,
  concertId: string,
  items: CreateOrderItemInput[],
  catalogMap: Map<string, TicketTypeCatalogItem>,
) => {
  const keys: string[] = [];
  const args: string[] = [String(items.length)]; // First argument is the number of items, followed by groups of (ticketTypeId, quantity, maxPerUser) for each item

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

// ---------------- Main Service Object ----------------
export const OrderService = {
  async rollbackStocks(userId: string, concertId: string, items: CreateOrderItemInput[]) {
    const keys: string[] = [];
    const args: string[] = [String(items.length)];

    for (const item of items) {
      keys.push(concertStockKey(concertId), userPurchasedKey(userId, concertId, item.ticketTypeId));
      args.push(item.ticketTypeId, String(item.quantity), "0");
    }

    await redis.eval(releaseStockLua, keys.length, ...keys, ...args);
  },

  /**
   * Creates a new order.
   * @param userId user ID of the order creator
   * @param incoming order creation request payload
   * @param idempotencyKeyValue idempotency key for ensuring idempotent requests
   * @returns A promise resolving to the created order response
   * @throws AppError if the user is unauthorized, if the order is already being processed, if the concert ID is missing, if ticket types are not found, or if there is an error during order creation
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

    console.log(
      "[Step 2] Idempotency check result for key",
      idempotencyKeyValue,
      ":",
      existingRecord,
    );

    if (existingRecord?.status === "PROCESSING") {
      throw new AppError("Order is already being processed", 409);
    }

    if (existingRecord?.status === "COMPLETED" && existingRecord.response) {
      return existingRecord.response;
    }

    if (!concertId) {
      throw new AppError("Concert ID is required", 400);
    }
    console.log("[Step 3] Setting Idempotency Record for concert:", concertId);

    await setIdempotencyRecord(idempotencyKeyValue, { status: "PROCESSING" });

    const catalog = await ensureConcertCache(concertId);
    const catalogMap = buildCatalogMap(catalog);
    const orderId = crypto.randomUUID();

    const totalPrice = requestItems.reduce((sum, item) => {
      const catalogItem = catalogMap.get(item.ticketTypeId);
      if (!catalogItem) {
        throw new AppError("Ticket type not found", 404);
      }
      return sum + catalogItem.price * item.quantity;
    }, 0);

    console.log("[Step 4] Attempting to reserve stocks for order:", orderId);

    await reserveStocks(userId, concertId, requestItems, catalogMap);

    try {
      console.log(
        "[Step 5] Stocks reserved successfully for order:",
        orderId,
        ". Attempting DB transaction to create order and payment intent.",
      );
      let outboxEventId = crypto.randomUUID();
      await db.transaction(async (trx) => {
        await OrderRepository.createOrder(trx, {
          id: orderId,
          userId,
          idempotencyKey: idempotencyKeyValue,
          totalAmount: totalPrice,
          status: "PROCESSING",
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

        await OrderRepository.createPaymentIntent(trx, outboxEventId, {
          orderId,
          userId,
          amount: totalPrice,
          paymentMethod: incoming.paymentMethod,
          idempotencyKey: idempotencyKeyValue,
        });
      });

      console.log(
        "[Step 6] Order and payment intent created successfully for order:",
        orderId,
        ". Adding job to payment queue.",
      );
      await paymentQueue.add(
        "CREATE_PAYMENT",
        {
          id: outboxEventId,
        },
        { removeOnComplete: true },
      );

      console.log(
        "[Step 7] Job added to payment queue for order:",
        orderId,
        ". Scheduling cleanup job for expired order.",
      );
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

      console.log(
        "[Step 8] Order creation process completed successfully for order:",
        orderId,
        ". Returning response to client.",
      );

      const response: OrderResponse = {
        status: "PROCESSING",
        orderId: orderId,
        totalPrice: totalPrice,
        paymentDeadline: toPaymentDeadline(),
        paymentUrl: "",
      };

      console.log("[Step 9] Setting Idempotency Record to COMPLETED for order:", orderId);

      await setIdempotencyRecord(idempotencyKeyValue, {
        status: "COMPLETED",
        response: response,
      });

      return response;
    } catch (error) {
      await OrderRepository.updateStatus(orderId, "FAILED");
      await this.rollbackStocks(userId, concertId, requestItems);
      await deleteIdempotencyRecord(idempotencyKeyValue);
      console.error("[Order.Service - createOrder]: Error creating order:", error);
      throw error;
    }
  },

  /**
   * Lists orders with pagination and optional filtering by status, concert ID, and user ID.
   * @param param0 Object containing pagination parameters (page, limit) and optional filters (status, concertId, userId)
   * @returns A promise resolving to an object containing the list of orders and pagination information
   * @throws AppError if page or limit parameters are invalid
   * @throws AppError if there is an error retrieving orders from the repository
   */
  async getOrderUrl(orderId: string): Promise<{ paymentUrl: string; status: string }> {
    const result = await PaymentRepository.getOrderUrl(orderId);

    if (!result) {
      throw new AppError("Order not found", 404);
    }

    return result;
  },
};
