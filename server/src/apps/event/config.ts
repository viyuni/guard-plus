import { port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { configEnv, type NodeEnv } from '#config';

const positiveInteger = () =>
  v.pipe(
    v.union([v.string(), v.number()]),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
  );

/**
 * Event App 专属的环境变量。
 *
 * 共享变量由 `#config` 统一解析成配置 ripple。
 */
export const eventEnv = createEnv({
  server: {
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
  biliRoom: number;
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
  nodeEnv: configEnv.NODE_ENV,
  biliRoom: configEnv.BILI_ROOM,
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
