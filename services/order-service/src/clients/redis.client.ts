import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export const redis = new (Redis as any)(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

export const bullredis = new (Redis as any)(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

let redisAvailable = false;

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
