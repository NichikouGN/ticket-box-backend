import { Worker } from "bullmq";
import { bullredis } from "../infrastructure/redis.client.js";
import { handleExpiredOrder } from "../jobs/handleExpired.job.js";
import { handleCompletedOrder } from "../jobs/handlePaid.job.js";
import { handleFailedOrder } from "../jobs/handleFailed.job.js";
import type { handleCompletedType } from "../types/job.types.js";
let workerStarted = false;

export const startOrderCleanupWorker = () => {
  if (workerStarted) {
    return;
  }

  workerStarted = true;

  const worker = new Worker(
    "order-queue",
    async (job) => {
      if (job.name === "CLEANUP_EXPIRED_ORDER") {
        const { order_id } = job.data as { order_id: string };
        await handleExpiredOrder(order_id);
        return;
      }

      if (job.name === "UPDATE_ORDER_COMPLETED") {
        const jobData = job.data as handleCompletedType;
        await handleCompletedOrder(jobData);
        return;
      }

      if (job.name === "UPDATE_ORDER_FAILED") {
        const jobData = job.data as { order_id: string };
        await handleFailedOrder(jobData.order_id);
        return;
      }
    },
    {
      connection: bullredis.duplicate(),
    },
  );

  worker.on("failed", (job, error) => {
    console.warn("Order cleanup job failed", job?.id, error.message);
  });

  worker.on("error", (error) => {
    console.warn("Order worker error", error.message);
  });
};
