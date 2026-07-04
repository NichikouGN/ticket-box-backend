import cron from "node-cron";
import db from "../db/knex.js";
import type { OutboxEventType } from "../types/internal.types.js";
import { paymentQueue } from "../queues/payment.queue.js";
import logger from "../utils/logger.js";

export const startOutboxCronJob = () => {
  let running = false;

  cron.schedule("*/30 * * * * *", async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      logger.info("[ORDER OUTBOX] Fetching pending events from orders_outbox table");
      const pendingEvennts = await db("orders_outbox")
        .where("status", "PENDING")
        .where("next_retry_at", "<=", db.fn.now())
        .orderBy("next_retry_at", "asc")
        .limit(10)
        .forUpdate()
        .skipLocked();

      for (const event of pendingEvennts) {
        await handlePendingEvents(event);
      }
    } catch (err) {
      logger.error({ err }, "[ORDER OUTBOX] Failed to relay message to BullMQ");
    } finally {
      running = false;
    }
  });

  const handlePendingEvents = async (event: OutboxEventType) => {
    try {
      switch (event.event_type) {
        case "CREATE_PAYMENT":
          await paymentQueue.add("CREATE_PAYMENT", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
            ...(event.job_id ? { jobId: event.job_id } : {}),
          });
          break;
        case "CLEANUP_EXPIRED_PAYMENT":
          await paymentQueue.add("CLEANUP_EXPIRED_PAYMENT", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
            ...(event.job_id ? { jobId: event.job_id } : {}),
          });
          break;
        default:
          logger.warn({ eventType: event.event_type }, "[ORDER OUTBOX] Received unknown outbox event type, skipping");
      }

      await db("orders_outbox").where({ id: event.id }).update({ status: "PROCESSED" });
    } catch (err) {
      logger.error({ err }, "[ORDER OUTBOX] Failed to relay message to BullMQ");

      const delay = 30_000;
      const jitter = Math.floor(Math.random() * 5_000); // Random jitter between 0 and 10 seconds
      const nextRetryAt = new Date(Date.now() + delay + jitter);

      await db("orders_outbox").where({ id: event.id }).update({ next_retry_at: nextRetryAt }).forUpdate().skipLocked();
    }
  };
};

startOutboxCronJob();
