import { Queue } from "bullmq";
import { bullredis } from "../clients/redis.client.js";

export const orderQueue = new Queue("order-queue", {
  connection: bullredis.duplicate(),
});
