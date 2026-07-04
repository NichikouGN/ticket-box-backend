import { Worker } from "bullmq";
import { bullredis } from "../clients/redis.client.js";
import logger from "../utils/logger.js";
import { handleCreatePaymentSuccess } from "../jobs/handleCreatePaymentSuccess.job.js";
import { handleCreatePaymentFailure } from "../jobs/handleCreatePaymentFailure.job.js";
import { cleanupOrderJob } from "../jobs/cleanupOrder.job.js";
import { handlePaymentSuccessJob } from "../jobs/handlePaymentSuccess.job.js";
import { handleLatePayment } from "../jobs/handleLatePayment.job.js";

export const createOrderWorker = async () => {
  const worker = new Worker(
    "order-queue",
    async (job) => {
      switch (job.name) {
        case "PAYMENT_CREATED":
          await handleCreatePaymentSuccess(job);
          break;
        case "CREATE_PAYMENT_FAILED":
          await handleCreatePaymentFailure(job);
          break;
        case "CLEANUP_EXPIRED_ORDER":
          await cleanupOrderJob(job);
          break;
        case "PAYMENT_SUCCESS":
          await handlePaymentSuccessJob(job);
          break;
        case "PAYMENT_EXPIRED":
          await handleLatePayment(job);
          break;
        default:
          return;
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("ready", () => {});
  worker.on("active", (job) => {});

  worker.on("failed", async (job, error) => {
    if (!job) return;

    if (job.attemptsMade !== job.opts.attempts!) {
      logger.warn(
        { jobId: job.id, eventType: job.name, attemptsMade: job.attemptsMade },
        `Order worker failed to process job, will retry: ${error.message}, attempts made: ${job.attemptsMade}`,
      );
      return;
    }

    switch (job.name) {
      default:
        logger.error(
          { jobId: job.id, eventType: job.name, attemptsMade: job.attemptsMade, error: error },
          `Order worker failed to process job after all retries: ${error.message}`,
        );
        break;
    }
  });

  worker.on("error", (error) => {
    logger.error({ error }, "[Worker - createOrderWorker] Order worker error");
  });
};

createOrderWorker();
