import pg from "pg";
import db from "../db/knex.js"; // Your existing Knex instance for DB operations
import dotenv from "dotenv";
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
  await client.query("LISTEN concerts_outbox_channel");
  logger.info("Concert Outbox Relay is actively listening for committed events...");

  client.on("notification", async (msg) => {
    if (!msg.payload) return;
    const outboxRow = JSON.parse(msg.payload);

    try {
      switch (outboxRow.event_type) {
        default:
          logger.warn(
            { eventType: outboxRow.event_type },
            "[CONCERT OUTBOX] Received unknown outbox event type, skipping",
          );
      }
      await db("concerts_outbox").where({ id: outboxRow.id }).update({ status: "PROCESSED" });
    } catch (err) {
      logger.error({ err }, "[CONCERT OUTBOX] Failed to relay message to BullMQ");
      await db("concerts_outbox")
        .where({ id: outboxRow.id })
        .update({ next_retry_at: new Date(Date.now() + 30 * 1000) });
    }
  });
}

startOutboxRelay().catch((err) => {
  logger.error({ err }, "[CONCERT OUTBOX] Error starting outbox relay");
  process.exit(1);
});
