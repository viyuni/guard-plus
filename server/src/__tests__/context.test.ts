import { afterAll, describe, expect, spyOn, test } from 'bun:test';

import { Cyrene, DisposedError, defineRipples } from 'cyrenejs';
import Elysia from 'elysia';
import { createClient, type RedisClientOptions } from 'redis';

import {
  biliRoomBinding,
  databaseBinding,
  dataSecretBinding,
  loggerBinding,
  redisBinding,
  registerCodeTtlBinding,
} from '#composition';
import { createDatabase } from '#infrastructure/db';
import { createLogger } from '#infrastructure/logger';
import BiliEvent from '#modules/bili-event';
import Point from '#modules/point';
import Reward from '#modules/reward';
import User from '#modules/user';

import { createTestContainer } from './helpers/test-container';

// 只验证依赖组装，不连接数据库或 Redis。
const db = createDatabase('postgres://test:test@localhost:1/di_test');
const redisOptions: RedisClientOptions = {};
const redis = createClient(redisOptions);
const logger = createLogger({ level: 'silent', pretty: false });

afterAll(() => db.$client.end());

describe('Cyrene application contexts', () => {
  test('shares providers inside a runtime and isolates different runtimes', async () => {
    const first = createTestContainer({ db, redis });
    const second = createTestContainer({ db, redis });

    await using firstRuntime = first;
    await using _secondRuntime = second;

    const firstContainer = await first.start();
    const secondContainer = await second.start();

    expect(await first.resolve(Point.PointTypeRepo)).toBe(firstContainer.PointTypeRepo);
    expect(await first.resolve(Point.PointTypeQuery)).toBe(firstContainer.PointTypeQuery);
    expect(firstContainer.PointTypeRepo).not.toBe(secondContainer.PointTypeRepo);
    expect(firstContainer.PointTypeQuery).not.toBe(secondContainer.PointTypeQuery);

    const findById = spyOn(firstContainer.PointTypeRepo, 'findById').mockResolvedValue(null);

    try {
      await expect(firstContainer.PointTypeQuery.get('missing')).rejects.toThrow();
      expect(findById).toHaveBeenCalledWith('missing');
      expect(await firstRuntime.resolve(Point.PointTypeRepo)).toBe(firstContainer.PointTypeRepo);
    } finally {
      findById.mockRestore();
    }
  });

  test('starts the event graph without HTTP auth or image configuration', async () => {
    const eventGraph = defineRipples({
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
    });

    const runtime = new Cyrene({
      ripples: eventGraph,
      bindings: [
        databaseBinding(db),
        redisBinding(redis),
        loggerBinding(logger),
        dataSecretBinding('test'),
        biliRoomBinding(721),
        registerCodeTtlBinding(300),
      ],
    });

    await using _runtime = runtime;

    const names = runtime.inspect().nodes.map(node => node.name);

    expect(names).toContain('RewardProcessor');
    expect(names).not.toContain('JwtSecret');
    expect(names).not.toContain('ImageStorage');
    expect(names).not.toContain('ProductUseCase');
  });

  test('disposes the runtime when Elysia stops without closing borrowed infrastructure', async () => {
    const runtime = createTestContainer({ db, redis });
    const container = await runtime.start();
    const context = new Elysia({ name: 'TestContext' }).onStop(() => runtime.dispose());
    const closeDb = spyOn(db.$client, 'end');
    const closeRedis = spyOn(redis, 'destroy');
    const app = new Elysia().use(context).listen(0);

    try {
      await app.stop();
      await expect(runtime.resolve(Point.PointTypeRepo)).rejects.toBeInstanceOf(DisposedError);
      expect(container.PointTypeRepo).toBeDefined();
      expect(closeDb).not.toHaveBeenCalled();
      expect(closeRedis).not.toHaveBeenCalled();
    } finally {
      closeDb.mockRestore();
      closeRedis.mockRestore();
      await runtime.dispose();
    }
  });
});
