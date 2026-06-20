import db from "../db/knex.js";
import type { Knex } from "knex";
import crypto from "crypto";
type DB = Knex | Knex.Transaction;

export const OutboxRepository = {
  async createOrderOutboxEvent(db: DB, eventType: string, payload: Object) {
    await db("orders_outbox")
      .insert({
        id: crypto.randomUUID(),
        event_type: eventType,
        payload: JSON.stringify(payload),
        status: "PENDING",
        created_at: db.fn.now(),
        next_retry_at: db.raw("NOW() + INTERVAL '30 seconds'"),
      })
      .returning("*");
  },

  async updateEventStatus(eventId: string, status: string) {
    const result = await db("orders_outbox")
      .where({ id: eventId })
      .update({ status })
      .returning("*");

    return result[0];
  },
};
