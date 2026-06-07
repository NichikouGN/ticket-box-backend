import { Queue } from "bullmq";
import { bullredis, redis } from "../infrastructure/redis.client.js";

export const orderQueue = new Queue("order-queue", {
  connection: bullredis.duplicate(),
});
