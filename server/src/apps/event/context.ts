import { Cyrene } from 'cyrenejs';

import { Database, PointImageUseCase, Redis, RewardLogger } from '#context/tokens';
import type { DbClient } from '#db';
import { BiliRoom, RegisterCodeTtl } from '#env/bili';
import type { EventConfig } from '#env/config';
import { DataSecret } from '#env/shared';
import { biliPasswordResetRepo, biliPasswordResetUseCase } from '#modules/auth';
import { biliRegisterRepo, biliRegisterUseCase } from '#modules/auth';
import { biliEventRepo } from '#modules/bili-event';
import {
  pointAccountRepo,
  pointAccountUseCase,
  pointBalanceUseCase,
  pointConversionRuleRepo,
  pointConversionUseCase,
  pointTransactionRepo,
  pointTransactionUseCase,
  pointTypeRepo,
  pointTypeUseCase,
} from '#modules/point';
import { rewardUseCase } from '#modules/reward';
import { userRepo, userUseCase } from '#modules/user';
import type { RedisClient } from '#redis';
import { logger } from '#utils/logger';

export interface CreateEventContextOptions {
  db: DbClient;
  redis: RedisClient;
  /** 事件进程的最小配置，见 `#apps/event/env`。 */
  config: EventConfig;
}

/**
 * 事件运行时只装配弹幕事件链路需要的依赖图。
 *
 * 这里显式挑选 provider，避免把商品、订单、看板等模块带进事件进程。
 */
export async function createEventContainer({ db, redis, config }: CreateEventContextOptions) {
  const runtime = new Cyrene({
    providers: {
      biliEventRepo,
      biliPasswordResetRepo,
      biliRegisterRepo,
      pointAccountRepo,
      pointConversionRuleRepo,
      pointTransactionRepo,
      pointTypeRepo,
      userRepo,
      biliPasswordResetUseCase,
      biliRegisterUseCase,
      pointAccountUseCase,
      pointBalanceUseCase,
      pointConversionUseCase,
      pointTransactionUseCase,
      pointTypeUseCase,
      rewardUseCase,
      userUseCase,
    },
    bindings: [
      { token: Database, value: db },
      { token: Redis, value: redis },
      { token: DataSecret, value: config.dataSecret },
      { token: BiliRoom, value: config.biliRoom },
      { token: RegisterCodeTtl, value: config.registerCodeTtlSeconds },
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
