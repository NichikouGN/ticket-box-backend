import { Queue } from "bullmq";
import { redis } from "../infrastructure/redis.client.js";

export const notificationQueue = new Queue("ticketbox-notifications", {
  connection: redis,
});
