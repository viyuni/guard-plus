import { defineRipples } from 'cyrenejs';

import { ProductRepo, StockMovementRepo } from './repository';
import { ProductUseCase, StockMovementUseCase } from './usecase';

// 静态领域 API
export * from './domain';
export * from './usecase/types';

/** product 模块的 Ripple Manifest。 */
export default defineRipples({
  ProductRepo,
  StockMovementRepo,
  ProductUseCase,
  StockMovementUseCase,
});
