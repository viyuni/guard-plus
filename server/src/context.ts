import { Cyrene } from 'cyrenejs';
import Elysia from 'elysia';

import type { DbClient } from '#db';
import type { ImageEnv } from '#env/image';
import type { RedisEnv } from '#env/redis';
import type { SharedEnv } from '#env/shared';
import { imageUseCase } from '#modules/image';
import type { RedisClient } from '#redis';
import { logger } from '#utils/logger';

import { providers } from './context/providers';
import {
  BiliRoom,
  Database,
  DataSecret,
  ImageSavePath,
  JwtSecret,
  PointImageUseCase,
  Redis,
  RegisterCodeTtl,
  RewardLogger,
} from './context/tokens';

export interface CreateSharedContextOptions {
  db: DbClient;
  redis: RedisClient;
  env: SharedEnv &
    RedisEnv &
    ImageEnv & {
      API_ORIGIN: string;
      JWT_SECRET: string;
      WEB_ORIGINS: string[];
      DATA_SECRET: string;
      BILI_ROOM?: number;
    };
}

/**
 * 共享依赖容器。
 *
 * `providers` 是一份扁平记录——Cyrene 本身没有分组概念，
 * 用例与仓储都是同级的 provider。
 */
export async function createContainer({ db, redis, env }: CreateSharedContextOptions) {
  const runtime = new Cyrene({
    providers,
    bindings: [
      { token: Database, value: db },
      { token: Redis, value: redis },
      { token: DataSecret, value: env.DATA_SECRET },
      { token: BiliRoom, value: env.BILI_ROOM },
      { token: RegisterCodeTtl, value: env.BILI_REGISTER_CODE_TTL_SECONDS },
      { token: RewardLogger, value: logger.scope('RewardUseCase') },
      { token: JwtSecret, value: env.JWT_SECRET },
      { token: ImageSavePath, value: env.IMAGE_SAVE_PATH },
      { token: PointImageUseCase, dependency: imageUseCase },
    ],
  });

  try {
    const container = await runtime.start();
    return { ...container, runtime };
  } catch (error) {
    await runtime.dispose();
    throw error;
  }
}

export async function createAppContext(options: CreateSharedContextOptions) {
  const container = await createContainer(options);

  const context = new Elysia({
    name: 'SharedContext',
  }).onStop(() => container.runtime.dispose());

  return {
    container,
    context,
  };
}
