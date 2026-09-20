import { afterAll, describe, expect, spyOn, test } from 'bun:test';

import { DisposedError } from 'cyrenejs';
import Elysia from 'elysia';
import { createClient, type RedisClientOptions } from 'redis';

import { createEventContainer } from '#apps/event/context';
import { createAppContext, createContainer } from '#context';
import type { CreateSharedContextOptions } from '#context';
import { createDatabase } from '#db/client';
import type { AppConfig, EventConfig } from '#env/config';
import { pointTypeRepo, pointTypeUseCase } from '#modules/point';
import { userRepo } from '#modules/user';

// 只验证依赖组装，不连接数据库或 Redis。
const db = createDatabase('postgres://test:test@localhost:1/di_test');
const redisOptions: RedisClientOptions = {};
const redis = createClient(redisOptions);

const config: AppConfig = {
  nodeEnv: 'test',
  dataSecret: 'test',
  jwtSecret: 'test',
  biliRoom: 721,
  registerCodeTtlSeconds: 300,
  imageSavePath: './tmp/test-images',
  apiOrigin: 'http://api.test.localhost',
  webOrigins: ['http://test.localhost'],
};

const options = {
  db,
  redis,
  config,
} satisfies CreateSharedContextOptions;

afterAll(() => db.$client.end());

describe('Cyrene application contexts', () => {
  test('shares providers inside a container and isolates different containers', async () => {
    const first = await createContainer(options);
    const second = await createContainer(options);
    await using firstRuntime = first.runtime;
    await using _secondRuntime = second.runtime;

    expect(await firstRuntime.resolve(userRepo)).toBe(first.userRepo);
    expect(await firstRuntime.resolve(pointTypeUseCase)).toBe(first.pointTypeUseCase);
    expect(first.userRepo).not.toBe(second.userRepo);
    expect(first.pointTypeUseCase).not.toBe(second.pointTypeUseCase);

    const findById = spyOn(first.pointTypeRepo, 'findById').mockResolvedValue(null);

    try {
      await expect(first.pointTypeUseCase.get('missing')).rejects.toThrow();
      expect(findById).toHaveBeenCalledWith('missing');
      expect(await firstRuntime.resolve(pointTypeRepo)).toBe(first.pointTypeRepo);
    } finally {
      findById.mockRestore();
    }
  });

  test('starts the event graph without HTTP auth or image configuration', async () => {
    const eventConfig: EventConfig = {
      nodeEnv: config.nodeEnv,
      dataSecret: config.dataSecret,
      biliRoom: config.biliRoom,
      registerCodeTtlSeconds: config.registerCodeTtlSeconds,
    };

    const container = await createEventContainer({ db, redis, config: eventConfig });
    await using runtime = container.runtime;
    const names = runtime.inspect().nodes.map(node => node.name);

    expect(names).toContain('RewardUseCase');
    expect(names).not.toContain('JwtSecret');
    expect(names).not.toContain('ImageUseCase');
    expect(names).not.toContain('ProductUseCase');
    expect(container.biliRegisterUseCase).not.toBe(container.biliPasswordResetUseCase);
  });

  test('disposes the runtime when Elysia stops without closing borrowed infrastructure', async () => {
    const { context, container } = await createAppContext(options);
    const closeDb = spyOn(db.$client, 'end');
    const closeRedis = spyOn(redis, 'destroy');
    const app = new Elysia().use(context).listen(0);

    try {
      await app.stop();
      await expect(container.runtime.resolve(userRepo)).rejects.toBeInstanceOf(DisposedError);
      expect(closeDb).not.toHaveBeenCalled();
      expect(closeRedis).not.toHaveBeenCalled();
    } finally {
      closeDb.mockRestore();
      closeRedis.mockRestore();
      await container.runtime.dispose();
    }
  });
});
