import Elysia from 'elysia';

import type { DbClient } from '#db';
import type { ImageEnv } from '#env/image';
import type { RedisEnv } from '#env/redis';
import type { SharedEnv } from '#env/shared';
import { ImageUseCase } from '#modules/image';
import { redis } from '#redis';
import { logger } from '#utils/logger';

import { createAuthGuard } from './modules/auth';
import { createAuthContext } from './modules/auth/context';
import { createDashboardContext } from './modules/dashboard/context';
import { createOrderContext } from './modules/order/context';
import { createPointContext } from './modules/point/context';
import { createProductContext } from './modules/product/context';
import { createRewardContext } from './modules/reward/context';
import { createUserContext } from './modules/user/context';

export interface CreateSharedContextOptions {
  db: DbClient;
  env: SharedEnv &
    RedisEnv &
    ImageEnv & {
      JWT_SECRET: string;
      DATA_SECRET: string;
      BILI_ROOM?: number;
    };
}

export function createContainer({ db, env }: CreateSharedContextOptions) {
  const auth = createAuthContext({ env, redis });
  const user = createUserContext({
    db,
    dataSecret: env.DATA_SECRET,
  });
  const imageUseCase = new ImageUseCase(env.IMAGE_SAVE_PATH);
  const point = createPointContext({
    db,
    imageUseCase,
    userUseCase: user.userUseCase,
  });
  const product = createProductContext({
    db,
    imageUseCase,
    pointTypeUseCase: point.pointTypeUseCase,
  });
  const order = createOrderContext({
    db,
    pointAccountRepo: point.pointAccountRepo,
    pointBalanceUseCase: point.pointBalanceUseCase,
    pointTypeUseCase: point.pointTypeUseCase,
    productUseCase: product.productUseCase,
    userBasicInfoCrypto: user.userBasicInfoCrypto,
    userUseCase: user.userUseCase,
  });
  const reward = createRewardContext({
    biliRoom: env.BILI_ROOM,
    db,
    logger: logger.scope('RewardUseCase'),
    pointAccountRepo: point.pointAccountRepo,
    pointBalanceUseCase: point.pointBalanceUseCase,
    pointTransactionRepo: point.pointTransactionRepo,
    pointTypeUseCase: point.pointTypeUseCase,
    userUseCase: user.userUseCase,
  });
  const dashboard = createDashboardContext({ db });

  return {
    repositories: {
      authSessionRepo: auth.authSessionRepo,
      biliRegisterRepo: auth.biliRegisterRepo,
      userRepo: user.userRepo,
      pointAccountRepo: point.pointAccountRepo,
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
    useCases: {
      authUseCase: auth.authUseCase,
      biliRegisterUseCase: auth.biliRegisterUseCase,
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
  };
}

export function createAppContext(options: CreateSharedContextOptions) {
  const container = createContainer(options);
  const context = new Elysia({
    name: 'SharedContext',
  })
    .use(createAuthGuard(container.useCases.authUseCase))
    .decorate(container.useCases);

  return {
    container,
    context,
  };
}
