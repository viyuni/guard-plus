import { ripple } from 'cyrenejs';

import { Database, BiliRoom, RewardLogger } from '#context/tokens';
import { BiliEventRepository } from '#modules/bili-event';
import {
  pointAccountRepo,
  pointBalanceUseCase,
  pointTransactionRepo,
  pointTypeUseCase,
} from '#modules/point/context';
import { userUseCase } from '#modules/user/context';

import { RewardRuleRepository } from './repository';
import { RewardRuleUseCase, RewardUseCase } from './usecase';

export const biliEventRepo = ripple({ db: Database }, ({ db }) => new BiliEventRepository(db), {
  debugName: 'BiliEventRepository',
});
export const rewardRuleRepo = ripple({ db: Database }, ({ db }) => new RewardRuleRepository(db), {
  debugName: 'RewardRuleRepository',
});

export const rewardUseCase = ripple(
  {
    biliRoom: BiliRoom,
    db: Database,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
    pointTypeUseCase,
    biliEventRepo,
    logger: RewardLogger,
    rewardRuleRepo,
    userUseCase,
  },
  deps => new RewardUseCase(deps),
  { debugName: 'RewardUseCase' },
);
export const rewardRuleUseCase = ripple(
  { pointTypeUseCase, rewardRuleRepo },
  deps => new RewardRuleUseCase(deps),
  { debugName: 'RewardRuleUseCase' },
);
