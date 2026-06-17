import cron from "node-cron";
import db from "../db/knex.js";
import type { OutboxEventType } from "../types/payment.types.js";
import { orderQueue } from "../queues/order.queue.js";
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
      logger.info("[PAYMENT OUTBOX] Fetching pending events from payments_outbox table");
      const pendingEvennts = await db("payments_outbox")
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
      logger.error({ err }, "[PAYMENT OUTBOX] Failed to relay message to BullMQ");
    } finally {
      running = false;
    }
  });

  const handlePendingEvents = async (event: OutboxEventType) => {
    try {
      switch (event.event_type) {
        case "PAYMENT_CREATED":
          await orderQueue.add("PAYMENT_CREATED", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "CREATE_PAYMENT_FAILURE":
          await orderQueue.add("CREATE_PAYMENT_FAILURE", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "PAYMENT_SUCCESS":
          await orderQueue.add("PAYMENT_SUCCESS", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "PAYMENT_EXPIRED":
          await orderQueue.add("PAYMENT_EXPIRED", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "LATE_WEBHOOK_RECEIVED":
          await paymentQueue.add("LATE_WEBHOOK_RECEIVED", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 5_000 },
          });
          break;
        default:
          logger.warn(
            { eventType: event.event_type },
            "Received unknown outbox event type, skipping",
          );
      }

      await db("payments_outbox").where({ id: event.id }).update({ status: "PROCESSED" });
    } catch (err) {
      logger.error({ err }, "[PAYMENT OUTBOX] Failed to relay message to BullMQ");

      const delay = 30_000;
      const jitter = Math.floor(Math.random() * 5_000); // Random jitter between 0 and 10 seconds
      const nextRetryAt = new Date(Date.now() + delay + jitter);

      await db("payments_outbox")
        .where({ id: event.id })
        .update({ next_retry_at: nextRetryAt })
        .forUpdate()
        .skipLocked();
    }
  };
};

startOutboxCronJob();
