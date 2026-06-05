import type { DbClient } from '#db';
import { BiliEventRepository } from '#modules/bili-event';
import type {
  PointAccountRepository,
  PointBalanceUseCase,
  PointTransactionRepository,
  PointTypeUseCase,
} from '#modules/point';
import type { UserUseCase } from '#modules/user';

import { RewardRuleRepository } from './repository';
import { RewardRuleUseCase, RewardUseCase } from './usecase';

export function createRewardContext({
  biliRoom,
  db,
  logger,
  pointAccountRepo,
  pointBalanceUseCase,
  pointTransactionRepo,
  pointTypeUseCase,
  userUseCase,
}: {
  biliRoom?: number;
  db: DbClient;
  logger?: {
    warn: (payload: Record<string, unknown>, message?: string) => void;
  };
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTransactionRepo: PointTransactionRepository;
  pointTypeUseCase: PointTypeUseCase;
  userUseCase: UserUseCase;
}) {
  const biliEventRepo = new BiliEventRepository(db);
  const rewardRuleRepo = new RewardRuleRepository(db);
  const rewardUseCase = new RewardUseCase({
    biliRoom,
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
    pointTypeUseCase,
    biliEventRepo,
    logger,
    rewardRuleRepo,
    userUseCase,
  });
  const rewardRuleUseCase = new RewardRuleUseCase({
    pointTypeUseCase,
    rewardRuleRepo,
  });

  return {
    biliEventRepo,
    rewardRuleRepo,
    rewardUseCase,
    rewardRuleUseCase,
  };
}
