import { Worker } from "bullmq";
import { bullredis } from "../clients/redis.client.js";
import { createPaymentJob } from "../jobs/createPayment.job.js";
import { handleCreatePaymentFailureJob } from "../jobs/handleCreatePaymentFailure.job.js";
import logger from "../utils/logger.js";
import { cleanupPaymentJob } from "../jobs/cleanupPayment.job.js";
import { handlePaymentRefund } from "../jobs/handlePaymentRefund.job.js";

export const createPaymentWorker = async () => {
  const worker = new Worker(
    "payment-queue",
    async (job) => {
      switch (job.name) {
        case "CREATE_PAYMENT":
          await createPaymentJob(job);
          break;

        case "CLEANUP_EXPIRED_PAYMENT":
          await cleanupPaymentJob(job);
          break;

        case "LATE_WEBHOOK_RECEIVED":
          await handlePaymentRefund(job);
          break;
        default:
          return;
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("ready", () => {
    logger.info({}, "[Worker - createPaymentWorker] Worker is ready");
  });
  worker.on("active", () => {
    logger.info({}, "[Worker - createPaymentWorker] Job is active");
  });

  worker.on("failed", async (job, error) => {
    if (!job) return;

    if (job.attemptsMade !== job.opts.attempts!) {
      logger.warn(
        { jobId: job.id, eventType: job.name, attemptsMade: job.attemptsMade },
        `[Worker - createPaymentWorker] Payment worker failed to process job, will retry: ${error.message}, attempts made: ${job.attemptsMade}`,
      );
      return;
    }

    switch (job.name) {
      case "CREATE_PAYMENT":
        logger.error(
          { jobId: job.id, eventType: job.name, attemptsMade: job.attemptsMade, error: error },
          `[Worker - createPaymentWorker] Payment worker failed to process CREATE_PAYMENT job after all retries: ${error.message}`,
        );
        await handleCreatePaymentFailureJob(job);
        break;
      default:
        break;
    }
  });

  worker.on("error", (error) => {
    logger.error(
      { jobId: null, eventType: null, error: error },
      "[Worker - createPaymentWorker] Payment worker error",
      error.message,
    );
  });
};
