import pg from "pg";
import db from "../db/knex.js";
import dotenv from "dotenv";
import { orderQueue } from "../queues/order.queue.js";
import { paymentQueue } from "../queues/payment.queue.js";
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
  await client.query("LISTEN payments_outbox_channel");
  logger.info("Outbox Relay is actively listening for committed events...");

  const eventQueue: any[] = [];
  let processing = false;

  const processNextEvent = async () => {
    if (processing || eventQueue.length === 0) return;
    processing = true;
    const msg = eventQueue.shift();

    if (msg && msg.payload) {
      let outboxRow: any = null;
      try {
        outboxRow = JSON.parse(msg.payload);
        logger.info({ eventId: outboxRow.id, eventType: outboxRow.event_type }, "[PAYMENT OUTBOX] Processing outbox event");

        switch (outboxRow.event_type) {
          case "PAYMENT_CREATED":
            await orderQueue.add("PAYMENT_CREATED", outboxRow.payload, {
              attempts: 3,
              backoff: { type: "exponential", delay: 3_000 },
              ...(outboxRow.job_id ? { jobId: outboxRow.job_id } : {}),
            });
            break;
          case "CREATE_PAYMENT_FAILED":
            await orderQueue.add("CREATE_PAYMENT_FAILED", outboxRow.payload, {
              attempts: 3,
              backoff: { type: "exponential", delay: 3_000 },
              ...(outboxRow.job_id ? { jobId: outboxRow.job_id } : {}),
            });
            break;
          case "PAYMENT_SUCCESS":
            await orderQueue.add("PAYMENT_SUCCESS", outboxRow.payload, {
              attempts: 3,
              backoff: { type: "exponential", delay: 3_000 },
              ...(outboxRow.job_id ? { jobId: outboxRow.job_id } : {}),
            });
            break;
          case "PAYMENT_EXPIRED":
            await orderQueue.add("PAYMENT_EXPIRED", outboxRow.payload, {
              attempts: 3,
              backoff: { type: "exponential", delay: 10_000 },
              ...(outboxRow.job_id ? { jobId: outboxRow.job_id } : {}),
            });
            break;
          case "LATE_WEBHOOK_RECEIVED":
            await paymentQueue.add("LATE_WEBHOOK_RECEIVED", outboxRow.payload, {
              attempts: 3,
              backoff: { type: "exponential", delay: 5_000 },
              ...(outboxRow.job_id ? { jobId: outboxRow.job_id } : {}),
            });
            break;
          default:
            logger.warn({ eventType: outboxRow.event_type }, "Received unknown outbox event type, skipping");
        }

        try {
          await db("payments_outbox").where({ id: outboxRow.id }).update({ status: "PROCESSED" });
        } catch (dbErr) {
          logger.error({ err: dbErr }, "[PAYMENT OUTBOX] Failed to update outbox status to PROCESSED in DB");
        }
      } catch (err) {
        logger.error({ err }, "[PAYMENT OUTBOX] Failed to relay message to BullMQ");
        if (outboxRow && outboxRow.id) {
          try {
            await db("payments_outbox")
              .where({ id: outboxRow.id })
              .update({ next_retry_at: new Date(Date.now() + 30 * 1000) });
          } catch (dbErr) {
            logger.error({ err: dbErr }, "[PAYMENT OUTBOX] Failed to update outbox next_retry_at in DB");
          }
        }
      }
    }

    processing = false;
    setImmediate(processNextEvent);
  };

  client.on("notification", (msg) => {
    eventQueue.push(msg);
    processNextEvent();
  });
}

startOutboxRelay().catch((err) => {
  logger.error({ err }, "Error starting outbox relay");
  process.exit(1);
});
