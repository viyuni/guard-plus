import { ProductRepo, StockMovementRepo } from './repository';
import { ProductUseCase, StockMovementUseCase } from './usecase';

// 静态领域 API
export * from './domain';
export * from './usecase/types';

/** product 模块的 Ripple Manifest。 */
export default {
  ProductRepo,
  StockMovementRepo,
  ProductUseCase,
  StockMovementUseCase,
};
