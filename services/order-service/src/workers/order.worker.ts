import { Worker } from "bullmq";
import { redis } from "../infrastructure/redis.client.js";
import { bullredis } from "../infrastructure/redis.client.js";
import { OrderService } from "../services/order.service.js";

let workerStarted = false;

export const startOrderCleanupWorker = () => {
  if (workerStarted) {
    return;
  }

  workerStarted = true;

  const worker = new Worker(
    "order-queue",
    async (job) => {
      if (job.name !== "CLEANUP_EXPIRED_ORDER") {
        return;
      }

      const { order_id } = job.data as { order_id: string };
      await OrderService.handleExpiredOrder(order_id);
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
