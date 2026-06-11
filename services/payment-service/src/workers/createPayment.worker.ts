import { Worker } from "bullmq";
import db from "../db/knex.js";
import { bullredis } from "../infrastructure/redis.client.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repository/payment.repository.js";

export const createPaymentWorker = async () => {
  const worker = new Worker(
    "payment-queue",
    async (job) => {
      if (job.name === "CREATE_PAYMENT") {
        console.log("[Step 10] Processing CREATE_PAYMENT job for order:", job.data.orderId);
        try {
          const { orderId, userId, amount, paymentMethod, idempotencyKey } = job.data as {
            orderId: string;
            userId: string;
            amount: number;
            paymentMethod: string;
            idempotencyKey: string;
          };

          const result = await PaymentService.createPayment({
            orderId,
            userId,
            amount,
            paymentMethod,
            idempotencyKey,
          });
          console.log(
            "[Step 15] Payment created successfully for order:",
            orderId,
            "Payment URL:",
            result.paymentUrl,
          );

          await db.transaction(async (trx) => {
            await trx("outbox_events")
              .update({
                status: "processed",
                updated_at: trx.fn.now(),
              })
              .where("id", job.data.id);

            await trx("payments").where("order_id", orderId).update({
              payment_url: result.paymentUrl,
              updated_at: trx.fn.now(),
            });
          });
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
