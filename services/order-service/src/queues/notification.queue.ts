import { Queue } from "bullmq";
import { bullredis, redis } from "../clients/redis.client.js";

export const notificationQueue = new Queue("notification-queue", {
  connection: bullredis.duplicate(),
});
