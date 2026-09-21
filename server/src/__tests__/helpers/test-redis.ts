import { createRedisClient, type RedisClient } from '#infrastructure/redis';

const testRedisUrl = Bun.env.TEST_REDIS_URL ?? Bun.env.REDIS_URL;
const testRedisSymbol = Symbol.for('guard-plus.test.redis');

type GlobalWithTestRedis = typeof globalThis & {
  [testRedisSymbol]?: RedisClient;
};

export function getTestRedis() {
  if (!testRedisUrl) {
    throw new Error('TEST_REDIS_URL is required for redis integration tests');
  }

  const globalWithRedis = globalThis as GlobalWithTestRedis;

  globalWithRedis[testRedisSymbol] ??= createRedisClient({
    url: testRedisUrl,
    connectionTimeoutMs: 5000,
    idleTimeoutMs: 0,
    maxRetries: 3,
  });

  return globalWithRedis[testRedisSymbol];
}

export async function closeTestRedis() {
  const globalWithRedis = globalThis as GlobalWithTestRedis;
  const redis = globalWithRedis[testRedisSymbol];

  if (!redis) {
    return;
  }

  globalWithRedis[testRedisSymbol] = undefined;

  await redis.destroy();
}
