import type { Knex } from "knex";
import db from "../db/knex.js";
import type { OrderListItem, OrderStatus } from "../types/order.types.js";

export type OrderItemInput = {
  concertId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
};

export const OrderRepository = {
  async findById(orderId: string) {
    return db("orders").where("id", orderId).first();
  },

  async findByIdempotencyKey(idempotencyKey: string) {
    return db("orders").where("idempotency_key", idempotencyKey).first();
  },

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
    const inserted = await trx("orders")
      .insert({
        id: input.id,
        user_id: input.userId,
        idempotency_key: input.idempotencyKey,
        total_amount: input.totalAmount,
        status: input.status,
      })
      .returning("id");

    return inserted[0];
  },

  async createOrderItems(trx: Knex.Transaction, orderId: string, items: OrderItemInput[]) {
    await trx("order_items").insert(
      items.map((item) => ({
        order_id: orderId,
        concert_id: item.concertId,
        ticket_type_id: item.ticketTypeId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.unitPrice * item.quantity,
      })),
    );
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    await db("orders").where("id", orderId).update({ status, updated_at: db.fn.now() });
  },

  async findOrderItems(orderId: string) {
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
