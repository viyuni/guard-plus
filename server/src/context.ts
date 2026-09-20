import { Cyrene } from 'cyrenejs';
import Elysia from 'elysia';

import type { DbClient } from '#db';
import { BiliRoom, RegisterCodeTtl } from '#env/bili';
import { ApiOrigin, type AppConfig, JwtSecret, WebOrigins } from '#env/config';
import { ImageSavePath } from '#env/image';
import { DataSecret } from '#env/shared';
import { SmtpConfig } from '#env/smtp';
import { ImageUseCase } from '#modules/image';
import type { RedisClient } from '#redis';
import { logger } from '#utils/logger';

import { providers } from './context/providers';
import { Database, PointImageUseCase, Redis, RewardLogger } from './context/tokens';

export interface CreateSharedContextOptions {
  db: DbClient;
  redis: RedisClient;
  /**
   * app 归一化后的运行时配置，见 `#env/config`。
   *
   * 组合根只需要把每个字段绑定到对应令牌；模块从不读 env 单例。
   */
  config: AppConfig;
}

/**
 * 共享依赖容器。
 *
 * `providers` 是一份扁平记录——Cyrene 本身没有分组概念，
 * 用例与仓储都是同级的 provider。
 */
export async function createContainer({ db, redis, config }: CreateSharedContextOptions) {
  const runtime = new Cyrene({
    providers,
    bindings: [
      { token: Database, value: db },
      { token: Redis, value: redis },
      { token: DataSecret, value: config.dataSecret },
      { token: JwtSecret, value: config.jwtSecret },
      { token: ApiOrigin, value: config.apiOrigin },
      { token: WebOrigins, value: config.webOrigins },
      { token: BiliRoom, value: config.biliRoom },
      { token: RegisterCodeTtl, value: config.registerCodeTtlSeconds },
      { token: ImageSavePath, value: config.imageSavePath },
      { token: SmtpConfig, value: config.smtp },
      { token: RewardLogger, value: logger.scope('RewardUseCase') },
      { token: PointImageUseCase, dependency: ImageUseCase },
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
