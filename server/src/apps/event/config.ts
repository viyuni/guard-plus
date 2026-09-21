import { port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#config/bili';
import { databaseEnv } from '#config/database';
import { redisEnv } from '#config/redis';
import { type NodeEnv, sharedEnv } from '#config/shared';
import type { RedisConnectionOptions } from '#infrastructure/redis';

const positiveInteger = () =>
  v.pipe(
    v.union([v.string(), v.number()]),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
  );

export const eventEnv = createEnv({
  server: {
    ...sharedEnv,
    ...databaseEnv,
    ...biliEnv,
    ...redisEnv,

    EVENT_PORT: v.optional(port(), 3700),
    VIYUNI_LOGIN_SYNC_URL: v.string(),
    VIYUNI_LOGIN_SYNC_PASSWORD: v.string(),
    EVENT_WORKER_CONCURRENCY: v.optional(positiveInteger(), 5),
    EVENT_WORKER_LEASE_MS: v.optional(positiveInteger(), 60_000),
    EVENT_WORKER_MAX_RETRIES: v.optional(positiveInteger(), 5),
    EVENT_WORKER_POLL_INTERVAL_MS: v.optional(positiveInteger(), 1_000),
    EVENT_WORKER_RETRY_BASE_DELAY_MS: v.optional(positiveInteger(), 1_000),
    EVENT_WORKER_RETRY_MAX_DELAY_MS: v.optional(positiveInteger(), 60_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export interface EventConfig {
  nodeEnv: NodeEnv;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataSecret: string;
  databaseUrl: string;
  redis: RedisConnectionOptions;
  biliRoom: number;
  registerCodeTtlSeconds: number;
  port: number;
  loginSync: {
    url: string;
    password: string;
  };
  worker: BiliGuardWorkerOptions;
}

export interface BiliGuardWorkerOptions {
  concurrency: number;
  leaseMs: number;
  maxRetries: number;
  pollIntervalMs: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
}

/** 事件进程只需要事件链路用到的最小配置。 */
export const eventConfig: EventConfig = {
  nodeEnv: eventEnv.NODE_ENV,
  logLevel: eventEnv.LOG_LEVEL,
  dataSecret: eventEnv.DATA_SECRET,
  databaseUrl: eventEnv.DATABASE_URL,
  redis: {
    url: eventEnv.REDIS_URL,
    password: eventEnv.REDIS_PASSWORD,
    connectionTimeoutMs: eventEnv.REDIS_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: eventEnv.REDIS_IDLE_TIMEOUT_MS,
    maxRetries: eventEnv.REDIS_MAX_RETRIES,
  },
  biliRoom: eventEnv.BILI_ROOM,
  registerCodeTtlSeconds: eventEnv.BILI_REGISTER_CODE_TTL_SECONDS,
  port: eventEnv.EVENT_PORT,
  loginSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
  worker: {
    concurrency: eventEnv.EVENT_WORKER_CONCURRENCY,
    leaseMs: eventEnv.EVENT_WORKER_LEASE_MS,
    maxRetries: eventEnv.EVENT_WORKER_MAX_RETRIES,
    pollIntervalMs: eventEnv.EVENT_WORKER_POLL_INTERVAL_MS,
    retryBaseDelayMs: eventEnv.EVENT_WORKER_RETRY_BASE_DELAY_MS,
    retryMaxDelayMs: eventEnv.EVENT_WORKER_RETRY_MAX_DELAY_MS,
  },
};
