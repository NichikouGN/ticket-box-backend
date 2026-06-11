import db from "../db/knex.js";
import { PaymentClient } from "../utils/payment.client.js";

const processOutboxEvents = async () => {
  const events = await db("outbox_events")
    .where({ status: "pending" })
    .where("retries", "<", 5)
    .orderBy("created_at", "asc")
    .limit(10)
    .forUpdate()
    .skipLocked();

  for (const event of events) {
    await handleEvent(event);
  }
};

const handleEvent = async (event: any) => {
  try {
    if (event.event_type === "CREATE_PAYMENT") {
      const payment = await PaymentClient.createPayment(JSON.parse(event.payload));

      await db.transaction(async (trx) => {
        await trx("outbox_events").where("id", event.id).update({
          status: "processed",
          updated_at: trx.fn.now(),
        });
        await trx("orders").where("id", event.payload.orderId).update({
          status: "processed",
          updated_at: trx.fn.now(),
        });
      });
    }
  } catch (error) {
    console.error(`Error processing outbox event ${event.id}:`, error);
    await db("outbox_events")
      .where("id", event.id)
      .update({
        retries: db.raw("retries + 1"),
        updated_at: db.fn.now(),
      });
  }
};
