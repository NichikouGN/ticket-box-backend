import { Queue } from "bullmq";
import { bullredis } from "../infrastructure/redis.client.js";

export const notificationQueue = new Queue("notification-queue", {
  connection: bullredis.duplicate(),
});
