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
import { concertClient } from "../clients/concert.client.js";
import { orderQueue } from "../queues/order.queue.js";
import { redis } from "../clients/redis.client.js";
import { reserveStockLua, releaseStockLua } from "../utils/stock.lua.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import logger from "../utils/logger.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import dotenv from "dotenv";
import { safeRedisHGetAll } from "../utils/redis.utils.js";
dotenv.config();

const CLEANUP_WINDOW_MINUTES = parseInt(process.env.CLEANUP_WINDOW_MINUTES || "15");
const IDEMPOTENCY_TTL_SECONDS = 60 * 60;
const PAYMENT_WINDOW_MINUTES = parseInt(process.env.PAYMENT_WINDOW_MINUTES || "10");
const RESERVATION_TTL_SECONDS = 15 * 60;

// ---------------- Redis Keys ----------------
const idempotencyKey = (key: string) => `order:idempotency:${key}`;
const concertStockKey = (concertId: string) => `catalog:concert:${concertId}:stock`;
const concertTicketsKey = (concertId: string) => `catalog:concert:${concertId}:tickets`;
const userPurchasedKey = (userId: string, concertId: string, ticketTypeId: string) =>
  `order:user:${userId}:concert:${concertId}:ticket_type:${ticketTypeId}:purchased`;

// ---------------- Helper Functions ----------------
const toPaymentDeadline = () => new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();

const getIdempotencyRecord = async (key: string) => {
  try {
    const payload = await redis.get(idempotencyKey(key));
    return payload ? (JSON.parse(payload) as { status: string; response?: OrderResponse }) : null;
  } catch {
    return null;
  }
};

const setIdempotencyRecord = async (key: string, payload: unknown) => {
  logger.info({ idempotencyKey: key, payload }, "Setting idempotency record in Redis");
  await redis.set(idempotencyKey(key), JSON.stringify(payload), "EX", IDEMPOTENCY_TTL_SECONDS);
};

const deleteIdempotencyRecord = async (key: string) => {
  logger.info({ idempotencyKey: key }, "Deleting idempotency record from Redis");
  await redis.del(idempotencyKey(key));
};

const validateSingleConcert = (items: CreateOrderItemInput[]) => {
  const concertIds = new Set(items.map((item) => item.concertId));

  if (concertIds.size !== 1) {
    throw new AppError("All ticket items must belong to the same concert", 400);
  }

  return items[0]?.concertId;
};

const ensureConcertCache = async (concertId: string) => {
  const [stockHashExists, ticketsHashExists] = await Promise.all([
    redis.exists(concertStockKey(concertId)),
    redis.exists(concertTicketsKey(concertId)),
  ]);

  console.log(
    `Checking cache for concertId: ${concertId}, stockHashExists: ${stockHashExists}, ticketsHashExists: ${ticketsHashExists}`,
  );

  await Promise.all([
    stockHashExists === 0 ? concertClient.get(`concerts/${concertId}/stocks`) : null,
    ticketsHashExists === 0 ? concertClient.get(`concerts/${concertId}/ticket-types`) : null,
  ]);
};

const getCatalogMap = async (concertId: string) => {
  const cached = await safeRedisHGetAll(concertTicketsKey(concertId));
  if (!cached || Object.keys(cached).length === 0) {
    throw new AppError("Ticket catalog not found", 404);
  }

  const map = new Map<string, TicketTypeCatalogItem>();
  for (const [ticketTypeId, ticketType] of Object.entries(cached)) {
    const parsed = JSON.parse(ticketType as string) as TicketTypeCatalogItem;
    map.set(ticketTypeId, parsed);
  }

  return map;
};

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

  const result = (await redis.eval(reserveStockLua, keys.length, ...keys, ...args)) as Array<string> | string;
  const normalized = Array.isArray(result) ? result[0] : result;

  if (normalized !== "SUCCESS") {
    throw new AppError("Vé đã hết hoặc vượt quá giới hạn mua", 400);
  }
};

// ---------------- Main Service Object ----------------
export const OrderService = {
  async rollbackStocks(orderId: string) {
    const orderItems = await OrderRepository.getOrderItems(db, orderId);

    const keys: string[] = [];
    const args: string[] = [String(orderItems.length)];

    for (const item of orderItems) {
      keys.push(concertStockKey(item.concertId), userPurchasedKey(item.userId, item.concertId, item.ticketTypeId));
      args.push(item.ticketTypeId, String(item.quantity), "0");
    }

    await redis.eval(releaseStockLua, keys.length, ...keys, ...args);
  },

  async createOrder(userId: string, incoming: CreateOrderInput, idempotencyKeyValue: string): Promise<OrderResponse> {
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const requestItems = incoming.data;
    const concertId = validateSingleConcert(requestItems);

    if (!concertId) {
      throw new AppError("Concert ID is required", 400);
    }

    const [existingRecord] = await Promise.all([
      getIdempotencyRecord(idempotencyKeyValue),
      ensureConcertCache(concertId),
    ]);

    if (existingRecord?.status === "PROCESSING") {
      throw new AppError("Order is already being processed", 409);
    }

    if (existingRecord?.status === "COMPLETED" && existingRecord.response) {
      return existingRecord.response;
    }

    await setIdempotencyRecord(idempotencyKeyValue, { status: "PROCESSING" });

    const catalogMap = await getCatalogMap(concertId);
    const orderId = crypto.randomUUID();

    const totalPrice = requestItems.reduce((sum, item) => {
      const catalogItem = catalogMap.get(item.ticketTypeId);
      if (!catalogItem) {
        throw new AppError("Ticket type not found", 404);
      }
      return sum + catalogItem.price * item.quantity;
    }, 0);

    await reserveStocks(userId, concertId, requestItems, catalogMap);

    logger.info(
      { userId, idempotencyKey: idempotencyKeyValue, orderId },
      "[SERVICE] Stocks reserved successfully for order:",
    );
    try {
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

        await OutboxRepository.createOrderOutboxEvent(trx, "CREATE_PAYMENT", {
          orderId,
          userId,
          amount: totalPrice,
          paymentMethod: incoming.paymentMethod,
        });
      });

      orderQueue.add(
        "CLEANUP_EXPIRED_ORDER",
        {
          orderId: orderId,
        },
        {
          delay: CLEANUP_WINDOW_MINUTES * 60 * 1000,
        },
      );

      const response: OrderResponse = {
        status: "PROCESSING",
        orderId: orderId,
        totalPrice: totalPrice,
        paymentDeadline: toPaymentDeadline(),
        paymentUrl: "",
      };

      await setIdempotencyRecord(idempotencyKeyValue, {
        status: "PROCESSING",
        response: response,
      });

      logger.info({ orderId: orderId }, "[SERVICE] Order created successfully with ID:", orderId);
      return response;
    } catch (error) {
      console.log(error);
      logger.error({ orderId: orderId, error }, "Error creating order:");

      await OrderRepository.updateOrderStatus(db, orderId, "FAILED");
      await this.rollbackStocks(orderId);
      await deleteIdempotencyRecord(idempotencyKeyValue);

      throw error;
    }
  },

  async getOrderUrl(orderId: string): Promise<{ paymentUrl: string; status: string }> {
    const result = await PaymentRepository.getOrderUrl(orderId);

    if (!result) {
      throw new AppError("Order not found", 404);
    }

    return result;
  },

  async markOrderAsFailed(orderId: string): Promise<void> {
    await db.transaction(async (trx) => {
      await OrderRepository.updateOrderStatus(trx, orderId, "FAILED");
    });
  },

  async publishOrderUpdate(orderId: string, status: string): Promise<void> {
    const redisPublisher = redis.duplicate();
    await redisPublisher.publish(
      "order_updates",
      JSON.stringify({
        orderId,
        status,
      }),
    );
    await redisPublisher.quit();
  },
};
