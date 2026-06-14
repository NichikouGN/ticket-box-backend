import db from "../db/knex.js";
import { PaymentClient } from "../clients/payment.client.js";
import logger from "../utils/logger.js";
import { redis } from "../infrastructure/redis.client.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export const processOutboxWorker = async () => {
  const events = await db("outbox_events")
    .where({ status: "PENDING" })
    .where("retries", "<", 5)
    .where("next_retry_at", "<=", db.fn.now())
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
      logger.info({ eventId: event.id, eventType: event.event_type }, "Processing outbox event");
      const result = await PaymentClient.createPayment(event.payload);

      logger.info(
        { eventId: event.id, orderId: event.payload.orderId, paymentResult: result },
        "Payment created successfully for outbox event",
      );

      await OutboxRepository.updateEventStatus(event.id, "PROCESSED");
      logger.info(
        { eventId: event.id, orderId: event.payload.orderId },
        "Updated outbox event status to PROCESSED for order:",
        event.payload.orderId,
      );

      const redisPublisher = redis.duplicate();
      await redisPublisher.publish(
        "order_updates",
        JSON.stringify({
          orderId: event.payload.orderId,
          status: "PENDING_PAYMENT",
          paymentUrl: result.paymentUrl,
        }),
      );
      await redisPublisher.quit();

      logger.info(
        { eventId: event.id, orderId: event.payload.orderId },
        "Published order update to Redis Pub/Sub for order:",
        event.payload.orderId,
      );
    }
  } catch (error) {
    logger.error(
      { eventId: event.id, eventType: event.event_type, error },
      "Error processing outbox event, will retry",
    );
    await db("outbox_events")
      .where("id", event.id)
      .update({
        retries: db.raw("retries + 1"),
        next_retry_at: db.raw("NOW() + INTERVAL '30 seconds'"),
      });
    logger.info(
      { eventId: event.id, orderId: event.payload.orderId },
      "Updated outbox event retries and next retry time for order:",
      event.payload.orderId,
    );
  }
};
