import type { StockMovementPageQuery } from '@shared/schema/stock';
import { type InferInput, ripple } from 'cyrenex';

import { StockMovementRepo } from '../repository';

export const StockMovementUseCase = ripple(
  'StockMovementUseCase',
  {
    StockMovementRepo,
  },
  ({ StockMovementRepo }) => ({
    /**
     * 获取库存变动
     */
    page(query: StockMovementPageQuery) {
      return StockMovementRepo.page(query);
    },
  }),
);

export type StockMovementUseCase = InferInput<typeof StockMovementUseCase>;
