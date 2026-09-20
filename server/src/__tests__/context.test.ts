import { afterAll, describe, expect, spyOn, test } from 'bun:test';

import { DisposedError } from 'cyrenejs';
import Elysia from 'elysia';
import { createClient, type RedisClientOptions } from 'redis';

import { createAppContext, createContainer, createEventContainer } from '#context';
import type { CreateSharedContextOptions } from '#context';
import { createDatabase } from '#db/client';
import { pointTypeRepo, pointTypeUseCase } from '#modules/point/context';
import { userRepo } from '#modules/user/context';

// 只验证依赖组装，不连接数据库或 Redis。
const db = createDatabase('postgres://test:test@localhost:1/di_test');
const redisOptions: RedisClientOptions = {};
const redis = createClient(redisOptions);

const options = {
  db,
  redis,
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    IMAGE_SAVE_PATH: './tmp/test-images',
    REDIS_URL: 'redis://localhost:1',
    REDIS_CONNECTION_TIMEOUT_MS: 5000,
    REDIS_IDLE_TIMEOUT_MS: 0,
    REDIS_MAX_RETRIES: 0,
    BILI_REGISTER_CODE_TTL_SECONDS: 300,
    BILI_ROOM: 721,
    API_ORIGIN: 'http://api.test.localhost',
    JWT_SECRET: 'test',
    WEB_ORIGINS: ['http://test.localhost'],
    DATA_SECRET: 'test',
  },
} satisfies CreateSharedContextOptions;

afterAll(() => db.$client.end());

describe('Cyrene application contexts', () => {
  test('shares providers inside a container and isolates different containers', async () => {
    const first = await createContainer(options);
    const second = await createContainer(options);
    await using firstRuntime = first.runtime;
    await using _secondRuntime = second.runtime;

    expect(await firstRuntime.resolve(userRepo)).toBe(first.repositories.userRepo);
    expect(await firstRuntime.resolve(pointTypeUseCase)).toBe(first.useCases.pointTypeUseCase);
    expect(first.repositories.userRepo).not.toBe(second.repositories.userRepo);
    expect(first.useCases.pointTypeUseCase).not.toBe(second.useCases.pointTypeUseCase);

    const findById = spyOn(first.repositories.pointTypeRepo, 'findById').mockResolvedValue(null);

    try {
      await expect(first.useCases.pointTypeUseCase.get('missing')).rejects.toThrow();
      expect(findById).toHaveBeenCalledWith('missing');
      expect(await firstRuntime.resolve(pointTypeRepo)).toBe(first.repositories.pointTypeRepo);
    } finally {
      findById.mockRestore();
    }
  });

  test('starts the event graph without HTTP auth or image configuration', async () => {
    const { JWT_SECRET: _jwt, IMAGE_SAVE_PATH: _images, ...env } = options.env;
    const container = await createEventContainer({ db, redis, env });
    await using runtime = container.runtime;
    const names = runtime.inspect().nodes.map(node => node.name);

    expect(names).toContain('RewardUseCase');
    expect(names).not.toContain('JwtSecret');
    expect(names).not.toContain('ImageUseCase');
    expect(names).not.toContain('ProductUseCase');
    expect(container.useCases.biliRegisterUseCase).not.toBe(
      container.useCases.biliPasswordResetUseCase,
    );
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
