import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export const redis = new (Redis as any)(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

let redisAvailable = false;

redis.on("ready", () => {
  redisAvailable = true;
});

redis.on("end", () => {
  redisAvailable = false;
});

redis.on("close", () => {
  redisAvailable = false;
});

redis.on("error", (error: Error) => {
  redisAvailable = false;
  console.warn("Redis connection lost. Falling back to DB", error.message);
});

export const getRedisHealth = () => (redisAvailable ? "up" : "down");
