import { Queue } from "bullmq";
import { redis, bullredis } from "../infrastructure/redis.client.js";

export const paymentQueue = new Queue("payment-queue", {
  connection: bullredis.duplicate(),
});
