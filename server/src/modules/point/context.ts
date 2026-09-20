import { ripple } from 'cyrenejs';

import { Database, PointImageUseCase } from '#context/tokens';
import { userUseCase } from '#modules/user/context';

import {
  PointAccountRepository,
  LegacyPointMigrationRepository,
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

export const pointAccountRepo = ripple(
  { db: Database },
  ({ db }) => new PointAccountRepository(db),
  { debugName: 'PointAccountRepository' },
);
export const legacyPointMigrationRepo = ripple(
  { db: Database },
  ({ db }) => new LegacyPointMigrationRepository(db),
  { debugName: 'LegacyPointMigrationRepository' },
);
export const pointConversionRuleRepo = ripple(
  { db: Database },
  ({ db }) => new PointConversionRuleRepository(db),
  { debugName: 'PointConversionRuleRepository' },
);
export const pointTransactionRepo = ripple(
  { db: Database },
  ({ db }) => new PointTransactionRepository(db),
  { debugName: 'PointTransactionRepository' },
);
export const pointTypeRepo = ripple({ db: Database }, ({ db }) => new PointTypeRepository(db), {
  debugName: 'PointTypeRepository',
});

export const pointTypeUseCase = ripple(
  { imageUseCase: PointImageUseCase, pointTypeRepo },
  deps => new PointTypeUseCase(deps),
  { debugName: 'PointTypeUseCase' },
);
export const pointBalanceUseCase = ripple(
  { pointAccountRepo, pointTransactionRepo, pointTypeUseCase, userUseCase },
  deps => new PointBalanceUseCase(deps),
  { debugName: 'PointBalanceUseCase' },
);
export const pointAccountUseCase = ripple(
  {
    db: Database,
    legacyPointMigrationRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    userUseCase,
  },
  deps => new PointAccountUseCase(deps),
  { debugName: 'PointAccountUseCase' },
);
export const pointTransactionUseCase = ripple(
  { db: Database, pointAccountRepo, pointBalanceUseCase, pointTransactionRepo },
  deps => new PointTransactionUseCase(deps),
  { debugName: 'PointTransactionUseCase' },
);
export const pointConversionUseCase = ripple(
  {
    db: Database,
    pointAccountRepo,
    pointBalanceUseCase,
    pointConversionRuleRepo,
    pointTypeUseCase,
  },
  deps => new PointConversionUseCase(deps),
  { debugName: 'PointConversionUseCase' },
);
