import pg from "pg";
import db from "../db/knex.js";
import dotenv from "dotenv";
import { orderQueue } from "../queues/order.queue.js";
import { paymentQueue } from "../queues/payment.queue.js";
import logger from "../utils/logger.js";
import { notificationQueue } from "../queues/notification.queue.js";

dotenv.config();

if (!process.env.DB_URL) {
  throw new Error("DB_URL is not defined in environment variables.");
}

async function startOutboxRelay() {
  const client = new pg.Client({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  client.on("error", (err) => {
    logger.error({ err }, "Outbox Relay Postgres Link Crashed:");
    process.exit(1);
  });

  await client.connect();
  await client.query("LISTEN notifications_outbox_channel");
  logger.info("Outbox Relay is actively listening for committed events...");

  client.on("notification", async (msg) => {
    if (!msg.payload) return;

    const outboxRow = JSON.parse(msg.payload);
    logger.info(
      { eventId: outboxRow.id, eventType: outboxRow.event_type },
      "[NOTIFICATION OUTBOX] Processing outbox event",
    );
    try {
      switch (outboxRow.event_type) {
        case "IN_APP_NOTIFICATION":
          await notificationQueue.add("IN_APP_NOTIFICATION", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "EMAIL_NOTIFICATION":
          await notificationQueue.add("EMAIL_NOTIFICATION", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "SET_24H_REMINDER":
          await notificationQueue.add("SET_24H_REMINDER", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "REMINDER_24H":
          await notificationQueue.add("REMINDER_24H", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "24H_IN_APP_NOTIFICATION":
          await notificationQueue.add("24H_IN_APP_NOTIFICATION", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        case "24H_EMAIL_NOTIFICATION":
          await notificationQueue.add("24H_EMAIL_NOTIFICATION", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });
          break;
        default:
          logger.warn({ eventType: outboxRow.event_type }, "Received unknown outbox event type, skipping");
      }

      await db("notifications_outbox").where({ id: outboxRow.id }).update({ status: "PROCESSED" });
    } catch (err) {
      logger.error({ err }, "[NOTIFICATION OUTBOX] Failed to relay message to BullMQ");
      await db("notifications_outbox")
        .where({ id: outboxRow.id })
        .update({ next_retry_at: new Date(Date.now() + 30 * 1000) });
    }
  });
}

startOutboxRelay().catch((err) => {
  logger.error({ err }, "Error starting outbox relay");
  process.exit(1);
});
