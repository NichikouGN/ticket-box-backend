import cron from "node-cron";
import db from "../db/knex.js";
import type { OutboxEventType } from "../types/internal.types.js";
import { notificationQueue } from "../queues/notification.queue.js";
import logger from "../utils/logger.js";

export const startOutboxCronJob = () => {
  let running = false;

  cron.schedule("*/30 * * * * *", async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      logger.info("[NOTIFICATION CRON] Fetching pending events from notifications_outbox table");
      const pendingEvennts = await db("notifications_outbox")
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
      logger.error({ err }, "[NOTIFICATION CRON] Failed to relay message to BullMQ");
    } finally {
      running = false;
    }
  });

  const handlePendingEvents = async (event: OutboxEventType) => {
    try {
      switch (event.event_type) {
        case "IN_APP_NOTIFICATION":
          await notificationQueue.add("IN_APP_NOTIFICATION", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "EMAIL_NOTIFICATION":
          await notificationQueue.add("EMAIL_NOTIFICATION", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "SET_24H_REMINDER":
          await notificationQueue.add("SET_24H_REMINDER", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "REMINDER_24H":
          await notificationQueue.add("REMINDER_24H", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "24H_IN_APP_NOTIFICATION":
          await notificationQueue.add("24H_IN_APP_NOTIFICATION", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "24H_EMAIL_NOTIFICATION":
          await notificationQueue.add("24H_EMAIL_NOTIFICATION", event.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        default:
          logger.warn({ eventType: event.event_type }, "Received unknown outbox event type, skipping");
      }
    } catch (err) {
      logger.error({ err }, "[NOTIFICATION OUTBOX] Failed to relay message to BullMQ");

      const delay = 30_000;
      const jitter = Math.floor(Math.random() * 5_000); // Random jitter between 0 and 10 seconds
      const nextRetryAt = new Date(Date.now() + delay + jitter);

      await db("notifications_outbox")
        .where({ id: event.id })
        .update({ next_retry_at: nextRetryAt })
        .forUpdate()
        .skipLocked();
    }
  };
};

startOutboxCronJob();
