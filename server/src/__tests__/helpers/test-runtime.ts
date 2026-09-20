import { Cyrene } from 'cyrenejs';
import type { DependencyEntries } from 'cyrenejs';
import { createClient, type RedisClientOptions } from 'redis';

import {
  BiliRoom,
  Database,
  DataSecret,
  JwtSecret,
  PointImageUseCase,
  Redis,
  RegisterCodeTtl,
  RewardLogger,
} from '#context/tokens';
import type { DbClient } from '#db';

/**
 * 测试用的依赖装配入口。
 *
 * 只提供占位基础设施与配置, 不建立真实连接:
 * 需要真实数据时由调用方替换已解析对象上的方法, 或改用集成测试夹具。
 */
const database = {} as DbClient;
const redisOptions: RedisClientOptions = {};
const redis = createClient(redisOptions);

export interface TestRuntimeOptions {
  biliRoom?: number;
  database?: DbClient;
}

export function createTestRuntime<T extends DependencyEntries>(
  providers: T,
  options: TestRuntimeOptions = {},
) {
  return new Cyrene({
    providers,
    bindings: [
      { token: Database, value: options.database ?? database },
      { token: Redis, value: redis },
      { token: DataSecret, value: 'test-data-secret' },
      { token: JwtSecret, value: 'test-jwt-secret' },
      { token: BiliRoom, value: options.biliRoom ?? 1 },
      { token: RegisterCodeTtl, value: 300 },
      { token: RewardLogger, value: undefined },
      { token: PointImageUseCase, value: undefined },
    ],
  });
}
