import { createClient } from 'redis';
import type { RedisClientOptions, RedisClientType } from 'redis';

import { redisEnv, type RedisEnv } from '#env/redis';
import { logger } from '#utils/logger';

export type RedisClient = RedisClientType<any, any, any, 2 | 3>;

export function createRedisClient(env: RedisEnv = redisEnv): RedisClient {
  const options: RedisClientOptions = {
    url: env.REDIS_URL,
    socket: {
      connectTimeout: env.REDIS_CONNECTION_TIMEOUT_MS,
      socketTimeout: env.REDIS_IDLE_TIMEOUT_MS || undefined,
      reconnectStrategy: retries => {
        if (retries > env.REDIS_MAX_RETRIES) {
          return new Error('Redis reconnect attempts exhausted');
        }

        return Math.min(retries * 100, 3000);
      },
    },
    disableOfflineQueue: false,
  };

  const client = createClient(options);

  client.on('connect', () => {
    logger.info('Redis connecting');
  });

  client.on('ready', () => {
    logger.info('Redis connected');
  });

  client.on('end', () => {
    logger.info('Redis connection closed');
  });

  client.on('error', error => {
    logger.error(error, 'Redis error');
  });

  void client.connect().catch(error => {
    logger.error(error, 'Redis connection failed');
  });

  return client;
}

export const redis = createRedisClient();
