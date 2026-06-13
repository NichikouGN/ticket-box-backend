import { Worker } from "bullmq";
import db from "../db/knex.js";
import { bullredis, redis } from "../infrastructure/redis.client.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repository/payment.repository.js";

export const createPaymentWorker = async () => {
  const worker = new Worker(
    "payment-queue",
    async (job) => {
      if (job.name === "CREATE_PAYMENT") {
        console.log("[Step 10] Processing CREATE_PAYMENT job for order:", job.data.orderId);
        try {
          // const { orderId, userId, amount, paymentMethod, idempotencyKey } = job.data as {
          //   orderId: string;
          //   userId: string;
          //   amount: number;
          //   paymentMethod: string;
          //   idempotencyKey: string;
          // };

          const payload = await db("outbox_events")
            .select("*")
            .where("id", job.data.id)
            .where("event_type", "CREATE_PAYMENT")
            .where("status", "PENDING")
            .forUpdate()
            .skipLocked()
            .first()
            .then(async (event) => {
              if (!event) {
                console.error(`Outbox event not found for id: ${job.data.id}`);
                throw new Error("Outbox event not found");
              }
              const payload = event.payload;
              return payload;
            });

          const result = await PaymentService.createPayment({
            orderId: payload.orderId,
            userId: payload.userId,
            amount: payload.amount,
            paymentMethod: payload.paymentMethod,
            idempotencyKey: payload.idempotencyKey,
          });
          console.log(
            "[Step 15] Payment created successfully for order:",
            payload.orderId,
            "Payment URL:",
            result.paymentUrl,
          );

          await db.transaction(async (trx) => {
            await trx("outbox_events")
              .update({
                status: "PROCESSED",
                updated_at: trx.fn.now(),
              })
              .where("id", job.data.id);

            await trx("payments").where("order_id", payload.orderId).update({
              payment_url: result.paymentUrl,
              status: "PENDING_PAYMENT",
              updated_at: trx.fn.now(),
            });
          });

          const redisPublisher = redis.duplicate();
          await redisPublisher.publish(
            "order_updates",
            JSON.stringify({
              orderId: payload.orderId,
              status: "PENDING_PAYMENT",
              paymentUrl: result.paymentUrl,
            }),
          );
          await redisPublisher.quit();
        } catch (error) {
          console.error("Error processing CREATE_PAYMENT job:", error);
          await PaymentRepository.updatePaymentIntentRetries(job.data.id);
          throw error;
        }
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("ready", () => {
    console.log("Payment worker is ready and listening for jobs...");
  });

  worker.on("active", (job) => {
    console.log("Processing job:", job.id, "of type:", job.name);
  });

  worker.on("failed", (job, error) => {
    console.warn("Payment job failed", job?.id, error.message);
  });

  worker.on("error", (error) => {
    console.warn("Payment worker error", error.message);
  });
};

createPaymentWorker();
