import dotenv from "dotenv";
import { Redis } from "ioredis";

dotenv.config();

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export const waitForRedisReady = async (redis: Redis): Promise<void> => {
  while (true) {
    try {
      await redis.ping();
      console.log("Redis is ready.");
      break;
    } catch (error) {
      console.log("Waiting for Redis to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
});

export const bullredis = new (Redis as any)(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
});

let redisAvailable = false;

redis.on("connect", () => {
  console.log("Redis connection established.");
});

redis.on("ready", () => {
  redisAvailable = true;
});

redis.on("close", () => {
  redisAvailable = false;
});

redis.on("end", () => {
  redisAvailable = false;
});

redis.on("error", (error: Error) => {
  redisAvailable = false;
  console.warn("Redis connection lost. Falling back to DB", error.message);
});

export const getRedisHealth = () => (redisAvailable ? "up" : "down");
