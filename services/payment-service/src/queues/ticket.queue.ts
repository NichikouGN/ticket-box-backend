import { Queue } from "bullmq";
import { bullredis } from "../infrastructure/redis.client.js";

export const ticketQueue = new Queue("ticket-queue", {
  connection: bullredis.duplicate(),
});
