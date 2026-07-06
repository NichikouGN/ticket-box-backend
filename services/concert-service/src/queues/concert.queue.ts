import { Queue } from "bullmq";
import { bullredis } from "../clients/redis.client.js";

export const concertQueue = new Queue("concert-queue", {
  connection: bullredis,
});
