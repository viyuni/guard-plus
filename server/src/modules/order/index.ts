import { defineRipples } from 'cyrenejs';

import { OrderRepo } from './repository';
import { OrderUseCase } from './usecase';

// 静态领域 API
export * from './domain';

/** order 模块的 Ripple Manifest。 */
export default defineRipples({
  OrderRepo,
  OrderUseCase,
});
