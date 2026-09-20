import { Cyrene, ripple } from 'cyrenejs';
import Elysia from 'elysia';

import type { DbClient } from '#db';
import type { ImageEnv } from '#env/image';
import type { RedisEnv } from '#env/redis';
import type { SharedEnv } from '#env/shared';
import { imageUseCase } from '#modules/image/context';
import type { RedisClient } from '#redis';
import { logger } from '#utils/logger';

import {
  Database,
  Redis,
  DataSecret,
  BiliRoom,
  RegisterCodeTtl,
  JwtSecret,
  ImageSavePath,
  PointImageUseCase,
  RewardLogger,
} from './context/tokens';
import { createAuthGuard, getAuthStateCookieOptions } from './modules/auth';
import * as auth from './modules/auth/context';
import * as dashboard from './modules/dashboard/context';
import * as order from './modules/order/context';
import * as point from './modules/point/context';
import * as product from './modules/product/context';
import * as reward from './modules/reward/context';
import * as user from './modules/user/context';

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

export interface CreateEventContextOptions {
  db: DbClient;
  redis: RedisClient;
  env: SharedEnv &
    RedisEnv & {
      DATA_SECRET: string;
      BILI_ROOM?: number;
    };
}

export async function createContainer({ db, redis, env }: CreateSharedContextOptions) {
  const runtime = new Cyrene({
    providers: {
      repositories: ripple(
        {
          authSessionRepo: auth.authSessionRepo,
          biliRegisterRepo: auth.biliRegisterRepo,
          biliPasswordResetRepo: auth.biliPasswordResetRepo,
          userRepo: user.userRepo,
          pointAccountRepo: point.pointAccountRepo,
          legacyPointMigrationRepo: point.legacyPointMigrationRepo,
          pointConversionRuleRepo: point.pointConversionRuleRepo,
          pointTransactionRepo: point.pointTransactionRepo,
          pointTypeRepo: point.pointTypeRepo,
          orderRepo: order.orderRepo,
          productRepo: product.productRepo,
          stockMovementRepo: product.stockMovementRepo,
          biliEventRepo: reward.biliEventRepo,
          rewardRuleRepo: reward.rewardRuleRepo,
          dashboardRepo: dashboard.dashboardRepo,
        },
        deps => deps,
      ),
      useCases: ripple(
        {
          authUseCase: auth.authUseCase,
          biliRegisterUseCase: auth.biliRegisterUseCase,
          biliPasswordResetUseCase: auth.biliPasswordResetUseCase,
          userUseCase: user.userUseCase,
          pointTypeUseCase: point.pointTypeUseCase,
          pointAccountUseCase: point.pointAccountUseCase,
          pointBalanceUseCase: point.pointBalanceUseCase,
          pointTransactionUseCase: point.pointTransactionUseCase,
          pointConversionUseCase: point.pointConversionUseCase,
          productUseCase: product.productUseCase,
          stockMovementUseCase: product.stockMovementUseCase,
          orderUseCase: order.orderUseCase,
          rewardUseCase: reward.rewardUseCase,
          rewardRuleUseCase: reward.rewardRuleUseCase,
          dashboardUseCase: dashboard.dashboardUseCase,
        },
        deps => deps,
      ),
    },
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

export async function createEventContainer({ db, redis, env }: CreateEventContextOptions) {
  const runtime = new Cyrene({
    providers: {
      repositories: ripple(
        {
          userRepo: user.userRepo,
          pointAccountRepo: point.pointAccountRepo,
          pointConversionRuleRepo: point.pointConversionRuleRepo,
          pointTransactionRepo: point.pointTransactionRepo,
          pointTypeRepo: point.pointTypeRepo,
          biliEventRepo: reward.biliEventRepo,
          rewardRuleRepo: reward.rewardRuleRepo,
          biliRegisterRepo: auth.biliRegisterRepo,
          biliPasswordResetRepo: auth.biliPasswordResetRepo,
        },
        deps => deps,
      ),
      useCases: ripple(
        {
          userUseCase: user.userUseCase,
          pointTypeUseCase: point.pointTypeUseCase,
          pointAccountUseCase: point.pointAccountUseCase,
          pointBalanceUseCase: point.pointBalanceUseCase,
          pointTransactionUseCase: point.pointTransactionUseCase,
          pointConversionUseCase: point.pointConversionUseCase,
          rewardUseCase: reward.rewardUseCase,
          biliRegisterUseCase: auth.biliRegisterUseCase,
          biliPasswordResetUseCase: auth.biliPasswordResetUseCase,
        },
        deps => deps,
      ),
    },
    bindings: [
      { token: Database, value: db },
      { token: Redis, value: redis },
      { token: DataSecret, value: env.DATA_SECRET },
      { token: BiliRoom, value: env.BILI_ROOM },
      { token: RegisterCodeTtl, value: env.BILI_REGISTER_CODE_TTL_SECONDS },
      { token: RewardLogger, value: logger.scope('RewardUseCase') },
      { token: PointImageUseCase, value: undefined },
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
  const authStateCookieOptions = getAuthStateCookieOptions(
    options.env.API_ORIGIN,
    options.env.WEB_ORIGINS,
  );

  const container = await createContainer(options);

  const context = new Elysia({
    name: 'SharedContext',
  })
    .use(createAuthGuard(container.useCases.authUseCase, authStateCookieOptions))
    .decorate(container.useCases)
    .onStop(() => container.runtime.dispose());

  return {
    container,
    context,
  };
}
