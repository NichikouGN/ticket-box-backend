import db from "../db/knex.js";
import type { Knex } from "knex";
import logger from "../utils/logger.js";
import crypto from "crypto";

export const OutboxRepository = {
  async createOrderOutboxEvent(trx: Knex.Transaction, eventType: string, payload: Object) {
    await trx("orders_outbox")
      .insert({
        id: crypto.randomUUID(),
        event_type: eventType,
        payload: JSON.stringify(payload),
        status: "PENDING",
        created_at: trx.fn.now(),
        next_retry_at: trx.raw("NOW() + INTERVAL '3000 seconds'"),
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
