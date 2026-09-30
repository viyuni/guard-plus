import {
  LegacyPointMigrationRepo,
  PointAccountRepo,
  PointConversionRuleRepo,
  PointTransactionRepo,
  PointTypeRepo,
} from './repository';
import {
  PointAccountUseCase,
  PointBalanceUseCase,
  PointConversionUseCase,
  PointTransactionUseCase,
  PointTypeAdminUseCase,
  PointTypeQuery,
} from './usecase';

// 静态领域 API
export * from './domain';

/** point 模块的 Ripple Manifest。 */
export default {
  PointAccountRepo,
  PointConversionRuleRepo,
  PointTransactionRepo,
  PointTypeRepo,
  LegacyPointMigrationRepo,

  PointTypeQuery,
  PointTypeAdminUseCase,
  PointAccountUseCase,
  PointBalanceUseCase,
  PointConversionUseCase,
  PointTransactionUseCase,
};
