import db from "../db/knex.js";
import logger from "../utils/logger.js";
import type { Knex } from "knex";
type DB = Knex | Knex.Transaction;

export const OutboxRepository = {
  async createPaymentOutboxEvent(db: DB, eventType: string, delay: number, payload: Object) {
    const result = await db("payments_outbox")
      .insert({
        id: crypto.randomUUID(),
        event_type: eventType,
        payload: JSON.stringify(payload),
        status: "PENDING",
        created_at: db.fn.now(),
        next_retry_at: db.raw(`NOW() + INTERVAL '${delay} seconds'`),
      })
      .returning("*");
    logger.info(
      { outboxEventId: result[0].id, intent: result[0] },
      "Successfully creating payment outbox event record in database",
    );
  },
};
