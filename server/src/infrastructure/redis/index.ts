import { createClient } from 'redis';
import type { RedisClientOptions, RedisClientType } from 'redis';

import type { AppLogger } from '#infrastructure/logger';

export type RedisClient = RedisClientType<any, any, any, 2 | 3>;

/** 连接 Redis 所需的技术配置, 由 App Boundary 提供。 */
export interface RedisConnectionOptions {
  url: string;
  password?: string;
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  maxRetries: number;
}

export function createRedisClient(
  options: RedisConnectionOptions,
  logger?: Pick<AppLogger, 'info' | 'error'>,
): RedisClient {
  const clientOptions: RedisClientOptions = {
    url: options.url,
    password: options.password,
    socket: {
      connectTimeout: options.connectionTimeoutMs,
      socketTimeout: options.idleTimeoutMs || undefined,
      reconnectStrategy: retries => {
        if (retries > options.maxRetries) {
          return new Error('Redis reconnect attempts exhausted');
        }

        return Math.min(retries * 100, 3000);
      },
    },
    disableOfflineQueue: false,
  };

  const client = createClient(clientOptions);

  client.on('connect', () => {
    logger?.info('Redis connecting');
  });

  client.on('ready', () => {
    logger?.info('Redis connected');
  });

  client.on('end', () => {
    logger?.info('Redis connection closed');
  });

  client.on('error', error => {
    logger?.error(error, 'Redis error');
  });

  void client.connect().catch(error => {
    logger?.error(error, 'Redis connection failed');
  });

  return client;
}
