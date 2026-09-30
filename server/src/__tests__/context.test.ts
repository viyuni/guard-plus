import { afterAll, describe, expect, spyOn, test } from 'bun:test';

import { elysiaCyrene } from '@cyrenex/elysia';
import { Cyrene, DisposedError } from 'cyrenex';
import Elysia from 'elysia';
import { createClient } from 'redis';
import type { RedisClientOptions } from 'redis';

import { DataSecret } from '#config';
import { Database } from '#infrastructure/db';
import { createDatabase } from '#infrastructure/db';
import BiliEvent from '#modules/bili-event';
import Point from '#modules/point';
import Reward from '#modules/reward';
import User from '#modules/user';
import { stub } from '#test-helpers/stub';

import { createTestContainer } from './helpers/test-container';

// 只验证依赖组装，不连接数据库或 Redis。
const db = createDatabase('postgres://test:test@localhost:1/di_test');
const redisOptions: RedisClientOptions = {};
const redis = createClient(redisOptions);

afterAll(() => db.$client.end());

describe('Cyrene application contexts', () => {
  test('shares providers inside a runtime and isolates different runtimes', async () => {
    const first = createTestContainer({ db, redis });
    const second = createTestContainer({ db, redis });

    await using firstRuntime = first;
    await using _secondRuntime = second;

    await first.init();
    await second.init();

    const firstContainer = first.ripples;
    const secondContainer = second.ripples;

    expect(first.resolve(Point.PointTypeRepo)).toBe(firstContainer.PointTypeRepo);
    expect(first.resolve(Point.PointTypeQuery)).toBe(firstContainer.PointTypeQuery);
    expect(firstContainer.PointTypeRepo).not.toBe(secondContainer.PointTypeRepo);
    expect(firstContainer.PointTypeQuery).not.toBe(secondContainer.PointTypeQuery);

    const findById = spyOn(firstContainer.PointTypeRepo, 'findById').mockResolvedValue(null);

    try {
      await expect(firstContainer.PointTypeQuery.get('missing')).rejects.toThrow();
      expect(findById).toHaveBeenCalledWith('missing');
      expect(firstRuntime.resolve(Point.PointTypeRepo)).toBe(firstContainer.PointTypeRepo);
    } finally {
      findById.mockRestore();
    }
  });

  test('starts the event graph without HTTP auth or image configuration', async () => {
    const eventGraph = {
      BiliEventRepo: BiliEvent.BiliEventRepo,

      PointAccountRepo: Point.PointAccountRepo,
      PointBalanceUseCase: Point.PointBalanceUseCase,
      PointTransactionRepo: Point.PointTransactionRepo,
      PointTypeQuery: Point.PointTypeQuery,
      PointTypeRepo: Point.PointTypeRepo,

      RewardProcessor: Reward.RewardProcessor,
      RewardRuleRepo: Reward.RewardRuleRepo,

      UserBasicInfoCrypto: User.UserBasicInfoCrypto,
      UserRepo: User.UserRepo,
      UserUseCase: User.UserUseCase,
    };

    const runtime = new Cyrene()
      .use(...Object.values(eventGraph))
      .override(Database, stub('Database', db))
      .override(DataSecret, stub('DataSecret', 'test'));

    await using _runtime = runtime;

    const keys = runtime.inspect().nodes.map(node => node.key);

    expect(keys).toContain('RewardProcessor');
    expect(keys).not.toContain('JwtSecret');
    expect(keys).not.toContain('ImageStorage');
    expect(keys).not.toContain('ProductUseCase');
  });

  test('disposes the runtime when the elysia cyrene plugin stops', async () => {
    const plugin = elysiaCyrene();

    const runtime = plugin.decorator.cyrene
      .use(Point.PointTypeRepo)
      .override(Database, stub('Database', db));

    await runtime.init();

    const repo = runtime.ripples.PointTypeRepo;
    const closeDb = spyOn(db.$client, 'end');
    const app = new Elysia().use(plugin).listen(0);

    try {
      await app.stop();
      // 插件 onStop 负责 dispose; 重复调用幂等, 这里等待清理真正结束。
      await runtime.dispose();

      expect(() => runtime.resolve(Point.PointTypeRepo)).toThrow(DisposedError);
      expect(repo).toBeDefined();
      expect(closeDb).not.toHaveBeenCalled();
    } finally {
      closeDb.mockRestore();
      await runtime.dispose();
    }
  });
});
