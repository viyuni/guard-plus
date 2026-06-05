import type { DbClient } from '#db';
import type { ImageUseCase } from '#modules/image';
import type { UserUseCase } from '#modules/user';

import {
  PointAccountRepository,
  PointConversionRuleRepository,
  PointTransactionRepository,
  PointTypeRepository,
} from './repository';
import {
  PointAccountUseCase,
  PointBalanceUseCase,
  PointConversionUseCase,
  PointTransactionUseCase,
  PointTypeUseCase,
} from './usecase';

export function createPointContext({
  db,
  imageUseCase,
  userUseCase,
}: {
  db: DbClient;
  imageUseCase?: ImageUseCase;
  userUseCase: UserUseCase;
}) {
  const pointAccountRepo = new PointAccountRepository(db);
  const pointConversionRuleRepo = new PointConversionRuleRepository(db);
  const pointTransactionRepo = new PointTransactionRepository(db);
  const pointTypeRepo = new PointTypeRepository(db);

  const pointTypeUseCase = new PointTypeUseCase({
    imageUseCase,
    pointTypeRepo,
  });
  const pointBalanceUseCase = new PointBalanceUseCase({
    pointAccountRepo,
    pointTransactionRepo,
    pointTypeUseCase,
    userUseCase,
  });
  const pointAccountUseCase = new PointAccountUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
  });
  const pointTransactionUseCase = new PointTransactionUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
  });
  const pointConversionUseCase = new PointConversionUseCase({
    db,
    pointAccountRepo,
    pointBalanceUseCase,
    pointConversionRuleRepo,
    pointTypeUseCase,
  });

  return {
    pointAccountRepo,
    pointConversionRuleRepo,
    pointTransactionRepo,
    pointTypeRepo,
    pointTypeUseCase,
    pointAccountUseCase,
    pointBalanceUseCase,
    pointTransactionUseCase,
    pointConversionUseCase,
  };
}
