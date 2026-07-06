import type { Request, Response, NextFunction } from "express";
import { bucketKey, safeRedisHGetAll, safeRedisHSet } from "../utils/redis.utils.js";

type TokenBucketConfig = {
  capacity: number;
  refillRate: number;
  prefix: string;
  getKey: (req: Request) => string | undefined;
};

export const createTokenBucket = (config: TokenBucketConfig) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    const userIp = config.getKey(req);

    if (!userIp) {
      return res.status(400).json({ success: false, message: "Unable to determine legitimate IP" });
    }

    const normalizedIp = userIp.slice(7);

    if (!normalizedIp) {
      return res.status(400).json({ success: false, message: "Unable to determine legitimate IP" });
    }

    const key = bucketKey(normalizedIp, config.prefix);

    const cache = await safeRedisHGetAll(key);

    if (!cache || Object.keys(cache).length === 0) {
      console.log("No cache found for key:", key, "Initializing new token bucket.");
      await safeRedisHSet(key, { tokens: config.capacity.toString(), lastRefill: Date.now().toString() }, 60);
      return next();
    }

    const map = new Map<string, number>();
    for (const [k, v] of Object.entries(cache)) {
      map.set(k, parseInt(v));
    }

    const tokens = map.get("tokens") ?? config.capacity;
    const lastRefill = map.get("lastRefill") ?? Date.now();

    const now = Date.now();
    const elapsed = Math.floor((now - lastRefill) / 1000);
    let newtokens = tokens - 1;

    if (elapsed >= 1 / config.refillRate) {
      const refillAmount = Math.floor(elapsed * config.refillRate);
      newtokens = Math.min(tokens + refillAmount, config.capacity) - 1;
      map.set("lastRefill", now);
    }

    if (newtokens < 0) {
      return res.status(429).json({ success: false, message: "Rate limit exceeded" });
    }

    map.set("tokens", newtokens);
    await safeRedisHSet(key, Object.fromEntries(map), 60);
    next();
  };
};

export default createTokenBucket;
