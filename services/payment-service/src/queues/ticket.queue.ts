import { Queue } from "bullmq";
import { bullredis } from "../clients/redis.client.js";

export const ticketQueue = new Queue("ticket-queue", {
  connection: bullredis.duplicate(),
});
