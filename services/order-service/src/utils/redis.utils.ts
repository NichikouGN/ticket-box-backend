import { redis } from "../clients/redis.client.js";

export const listKey = (page: number, limit: number) => `catalog:concerts:page:${page}:limit:${limit}`;
export const detailKey = (concertId: string) => `catalog:concert:${concertId}`;
export const ticketsKey = (concertId: string) => `catalog:concert:${concertId}:tickets`;
export const ticketLimitationKey = (concertId: string, ticketTypeId: string) =>
  `catalog:concert:${concertId}:ticket_limitation:${ticketTypeId}`;
export const stockKey = (concertId: string) => `catalog:concert:${concertId}:stock`;

export const safeRedisGet = async (key: string) => {
  try {
    return await redis.get(key);
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
    return null;
  }
};

export const safeRedisMGet = async (keys: string[]) => {
  try {
    return await redis.mget(...keys);
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
    return null;
  }
};

export const safeRedisHGetAll = async (key: string) => {
  try {
    return await redis.hgetall(key);
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
    return null;
  }
};

export const safeRedisSet = async (key: string, value: string, ttlSeconds: number) => {
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
  }
};

export const safeRedisHSet = async (key: string, value: Record<string, unknown>, ttlSeconds?: number) => {
  try {
    await redis.hset(key, value);
    if (ttlSeconds) {
      await redis.expire(key, ttlSeconds);
    }
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
  }
};

export const safeRedisDel = async (keys: string[]) => {
  if (keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
  }
};

export const deleteKeysByPattern = async (pattern: string) => {
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];

    for await (const chunk of stream) {
      keys.push(...(chunk as string[]));
    }

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn("Redis connection lost. Falling back to DB", error);
  }
};
