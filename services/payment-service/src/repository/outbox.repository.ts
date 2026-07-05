import db from "../db/knex.js";
import type { OutboxEventType } from "../types/payment.types.js";
import logger from "../utils/logger.js";
import type { Knex } from "knex";
type DB = Knex | Knex.Transaction;

export const OutboxRepository = {
  async createPaymentOutboxEvent(db: DB, eventType: string, payload: Object, jobId = "", retryDelay = 30) {
    const result = await db("payments_outbox")
      .insert({
        id: crypto.randomUUID(),
        job_id: jobId ? jobId : null,
        event_type: eventType,
        payload: JSON.stringify(payload),
        status: "PENDING",
        created_at: db.fn.now(),
        next_retry_at: db.raw(`NOW() + INTERVAL '${retryDelay} seconds'`),
      })
      .returning("*");
    logger.info(
      { outboxEventId: result[0].id, intent: result[0] },
      "Successfully creating payment outbox event record in database",
    );
  },

  // async getPendingOutboxEvents(db: DB, limit: number): Promise<OutboxEventType[]> {
  //   const events = await db("payments_outbox")
  //     .where("status", "PENDING")
  //     .where("next_retry_at", "<=", db.fn.now())
  //     .orderBy("next_retry_at", "asc")
  //     .limit(limit)
  //     .forUpdate()
  //     .skipLocked();

  //   return events.map((event) => ({
  //     id: event.id,
  //     eventType: event.event_type,
  //     payload: JSON.parse(event.payload),
  //     status: event.status,
  //     nextRetryAt: event.next_retry_at,
  //     createdAt: event.created_at,
  //   }));
  // },
};
