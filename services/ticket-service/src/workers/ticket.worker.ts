import { Worker } from "bullmq";
import { bullredis } from "../clients/redis.client.js";
import logger from "../utils/logger.js";
import { handleTicketGeneration } from "../jobs/handleTicketGeneration.job.js";

export const createPaymentWorker = async () => {
  const worker = new Worker(
    "ticket-queue",
    async (job) => {
      console.log("[Ticket Worker] Processing job:", job.name, "with data:", job.data);
      switch (job.name) {
        case "GENERATE_TICKETS": {
          await handleTicketGeneration(job);
        }
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
