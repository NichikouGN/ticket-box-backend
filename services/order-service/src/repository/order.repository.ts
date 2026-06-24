import type { Knex } from "knex";
import db from "../db/knex.js";
import type { OrderListItem, OrderStatus } from "../types/order.types.js";
import logger from "../utils/logger.js";
type DB = Knex | Knex.Transaction;

export type OrderItemInput = {
  concertId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
};

export const OrderRepository = {
  async getOrderItems(
    db: DB,
    orderId: string,
  ): Promise<
    {
      userId: string;
      concertId: string;
      ticketTypeId: string;
      quantity: number;
    }[]
  > {
    const result = await db("orders")
      .join("order_items", "order_items.order_id", "orders.id")
      .select("orders.user_id", "order_items.concert_id", "order_items.ticket_type_id", "order_items.quantity")
      .where("orders.id", orderId);

    return result.map((row) => ({
      userId: row.user_id,
      concertId: row.concert_id,
      ticketTypeId: row.ticket_type_id,
      quantity: row.quantity,
    }));
  },

  async findById(db: DB, orderId: string) {
    return db("orders").where("id", orderId).first();
  },

  async findByIdempotencyKey(db: DB, idempotencyKey: string) {
    return db("orders").where("idempotency_key", idempotencyKey).first();
  },

  /**
   * Creates a new order within a transactional context.
   * @param trx Knex transaction object to ensure atomicity of order creation and related operations. This allows for rolling back all changes if any step fails, maintaining data integrity.
   * @param input Input object containing the necessary data to create an order, including a unique order ID, the user ID of the customer placing the order, an idempotency key to prevent duplicate orders, the total amount for the order, and the initial status of the order.
   * @returns A promise that resolves to the ID of the newly created order. This ID can be used for further operations related to the order, such as adding order items or processing payments. If the order creation fails, the transaction will be rolled back and an error will be thrown.
   * @throws AppError if there is an error during the order creation process, such as database errors or validation issues. The error will contain a message and a status code that can be used to inform the client of the failure reason.
   */
  async createOrder(
    trx: Knex.Transaction,
    input: {
      id: string;
      userId: string;
      idempotencyKey: string;
      totalAmount: number;
      status: OrderStatus;
    },
  ) {
    await trx("orders").insert({
      id: input.id,
      user_id: input.userId,
      idempotency_key: input.idempotencyKey,
      total_amount: input.totalAmount,
      status: input.status,
    });
  },

  async createOrderItems(trx: Knex.Transaction, orderId: string, items: OrderItemInput[]) {
    const orderItems = items.map((item) => ({
      order_id: orderId,
      concert_id: item.concertId,
      ticket_type_id: item.ticketTypeId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
    }));

    await trx("order_items").insert(orderItems);
  },

  async updateOrderStatus(db: DB, orderId: string, status: OrderStatus) {
    await db("orders").where("id", orderId).update({ status, updated_at: db.fn.now() });
  },

  async findOrderItems(db: DB, orderId: string) {
    return db("order_items")
      .where("order_id", orderId)
      .select("concert_id", "ticket_type_id", "quantity", "unit_price", "line_total");
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
    const offset = (page - 1) * limit;

    const baseQuery = db("orders as o")
      .join("users as u", "u.id", "o.user_id")
      .join("order_items as oi", "oi.order_id", "o.id")
      .join("concerts as c", "c.id", "oi.concert_id")
      .groupBy("o.id", "u.email", "c.title")
      .select(
        "o.id",
        "u.email as user_email",
        db.raw("MIN(c.title) as concert_title"),
        "o.total_amount",
        "o.status",
        "o.created_at",
      )
      .orderBy("o.created_at", "desc")
      .offset(offset)
      .limit(limit);

    if (status) {
      baseQuery.where("o.status", status);
    }

    if (concertId) {
      baseQuery.where("c.id", concertId);
    }

    if (userId) {
      baseQuery.where("o.user_id", userId);
    }

    const rows = await baseQuery;
    const totalRow = await db("orders as o")
      .join("order_items as oi", "oi.order_id", "o.id")
      .join("concerts as c", "c.id", "oi.concert_id")
      .modify((queryBuilder) => {
        if (status) {
          queryBuilder.where("o.status", status);
        }

        if (concertId) {
          queryBuilder.where("c.id", concertId);
        }

        if (userId) {
          queryBuilder.where("o.user_id", userId);
        }
      })
      .countDistinct<{ count: string }>({ count: "o.id" })
      .first();

    return {
      rows: rows as OrderListItem[],
      totalItems: Number(totalRow?.count ?? 0),
    };
  },
};
