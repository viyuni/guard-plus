import { Cyrene } from 'cyrenejs';
import type { DependencyEntries, ValidRipples } from 'cyrenejs';
import { createClient, type RedisClientOptions } from 'redis';

import {
  biliRoomBinding,
  databaseBinding,
  dataSecretBinding,
  jwtSecretBinding,
  loggerBinding,
  redisBinding,
  registerCodeTtlBinding,
} from '#composition';
import type { DbClient } from '#infrastructure/db';
import { createLogger } from '#infrastructure/logger';

/**
 * 测试用的最小依赖装配入口。
 *
 * 只提供占位基础设施与配置, 不建立真实连接:
 * 需要真实数据时由调用方替换已解析对象上的方法, 或改用集成测试夹具。
 *
 * 这里只绑当前用例真正可达的令牌 —— 没有邮件能力就不会去绑 `Mailer`。
 */
const database = {} as DbClient;
const redisOptions: RedisClientOptions = {};
const redis = createClient(redisOptions);

export interface TestRuntimeOptions {
  biliRoom?: number;
  database?: DbClient;
}

export function createTestRuntime<const T extends DependencyEntries>(
  ripples: T & ValidRipples<T>,
  options: TestRuntimeOptions = {},
) {
  return new Cyrene({
    ripples,
    bindings: [
      databaseBinding(options.database ?? database),
      redisBinding(redis),
      loggerBinding(createLogger({ level: 'silent', pretty: false })),
      dataSecretBinding('test-data-secret'),
      jwtSecretBinding('test-jwt-secret'),
      biliRoomBinding(options.biliRoom ?? 1),
      registerCodeTtlBinding(300),
    ],
  });
}
