import { Queue } from "bullmq";
import { bullredis } from "../clients/redis.client.js";

export const paymentQueue = new Queue("payment-queue", {
  connection: bullredis.duplicate(),
});
