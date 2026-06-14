import { Worker } from "bullmq";
import { bullredis, redis } from "../infrastructure/redis.client.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repository/payment.repository.js";
import logger from "../utils/logger.js";
import { AppError } from "../types/appError.types.js";
import { orderClient } from "../clients/order.client.js";

export const createPaymentWorker = async () => {
  const worker = new Worker(
    "payment-queue",
    async (job) => {
      if (job.name === "CREATE_PAYMENT") {
        logger.info(
          "===================== [PaymentService - Worker - CREATE_PAYMENT] =====================",
        );
        try {
          const { eventId, orderId, userId, amount, paymentMethod, idempotencyKey } = job.data as {
            eventId: string;
            orderId: string;
            userId: string;
            amount: number;
            paymentMethod: string;
            idempotencyKey: string;
          };

          logger.info(
            {
              jobId: job.data.id,
              eventType: job.name,
              payload: { eventId, orderId, userId, amount, paymentMethod, idempotencyKey },
            },
            "Creating payment for order:",
            orderId,
          );

          const result = await PaymentService.createPayment({
            orderId: orderId,
            userId: userId,
            amount: amount,
            paymentMethod: paymentMethod,
            idempotencyKey: idempotencyKey,
          });

          await orderClient.patch(`/outbox/${eventId}/status`, {
            status: "PROCESSED",
          });

          logger.info(
            { jobId: job.data.id, eventType: job.name, orderId: orderId },
            "Successfully updated outbox event status to PROCESSED for order:",
            orderId,
          );

          const redisPublisher = redis.duplicate();
          await redisPublisher.publish(
            "order_updates",
            JSON.stringify({
              orderId: orderId,
              status: "PENDING_PAYMENT",
              paymentUrl: result.paymentUrl,
            }),
          );
          await redisPublisher.quit();

          logger.info(
            { jobId: job.data.id, eventType: job.name, orderId: orderId },
            "Published order update to Redis Pub/Sub for order:",
            orderId,
          );
        } catch (error) {
          throw error;
        }
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("ready", () => {
    logger.info("Payment worker is ready and listening for jobs...");
  });

  worker.on("active", (job) => {});

  worker.on("failed", (job, error) => {
    logger.warn({ jobId: job?.id, eventType: job?.name }, "Payment job failed", error.message);
  });

  worker.on("error", (error) => {
    logger.warn({ jobId: null, eventType: null }, "Payment worker error", error.message);
  });
};

createPaymentWorker();
