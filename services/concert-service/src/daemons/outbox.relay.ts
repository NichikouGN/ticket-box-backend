import pg from "pg";
import db from "../db/knex.js"; // Your existing Knex instance for DB operations
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { concertQueue } from "../queues/concert.queue.js";

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
    console.error("Outbox Relay Postgres Link Crashed:", err);
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
        case "GENERATE_ARTIST_BIOS":
          await concertQueue.add("GENERATE_ARTIST_BIOS", outboxRow.payload, {
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 30_0000, // 30 seconds
            },
          });
          break;
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
  console.error("Error starting Concert Outbox Relay:", err);
  console.log(process.env.DB_URL);
  process.exit(1);
});
