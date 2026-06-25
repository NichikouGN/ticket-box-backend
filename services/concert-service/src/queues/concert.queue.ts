import { Queue } from "bullmq";
import { redis } from "../clients/redis.client.js";

export const concertQueue = new Queue("concert-queue", {
  connection: redis,
});
