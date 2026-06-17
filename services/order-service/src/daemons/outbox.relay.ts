import pg from "pg";
import db from "../db/knex.js"; // Your existing Knex instance for DB operations
import dotenv from "dotenv";
import { paymentQueue } from "../queues/payment.queue.js"; // Your existing BullMQ queue instance
import logger from "../utils/logger.js";

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
  await client.query("LISTEN orders_outbox_channel");
  logger.info("Order Outbox Relay is actively listening for committed events...");

  client.on("notification", async (msg) => {
    if (!msg.payload) return;
    const outboxRow = JSON.parse(msg.payload);

    try {
      switch (outboxRow.event_type) {
        case "CREATE_PAYMENT":
          const job = await paymentQueue.add("CREATE_PAYMENT", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });

          break;
        case "CLEANUP_EXPIRED_PAYMENT":
          await paymentQueue.add("CLEANUP_EXPIRED_PAYMENT", outboxRow.payload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
          });

          break;
        default:
          logger.warn(
            { eventType: outboxRow.event_type },
            "[ORDER OUTBOX] Received unknown outbox event type, skipping",
          );
      }
      await db("orders_outbox").where({ id: outboxRow.id }).update({ status: "PROCESSED" });
    } catch (err) {
      logger.error({ err }, "[ORDER OUTBOX] Failed to relay message to BullMQ");
      await db("orders_outbox")
        .where({ id: outboxRow.id })
        .update({ next_retry_at: new Date(Date.now() + 30 * 1000) })
        .forUpdate()
        .skipLocked();
    }
  });
}

startOutboxRelay().catch((err) => {
  logger.error({ err }, "[ORDER OUTBOX] Error starting outbox relay");
  process.exit(1);
});
