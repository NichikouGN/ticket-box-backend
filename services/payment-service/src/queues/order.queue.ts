import { Queue } from "bullmq";
import { bullredis } from "../infrastructure/redis.client.js";

export const orderQueue = new Queue("order-queue", {
  connection: bullredis.duplicate(),
});
