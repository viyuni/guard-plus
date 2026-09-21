import type { StockMovementPageQuery } from '@shared/schema/stock';
import { type InferInput, ripple } from 'cyrenejs';

import { StockMovementRepo } from '../repository';

export const StockMovementUseCase = ripple(
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
  { debugName: 'StockMovementUseCase' },
);

export type StockMovementUseCase = InferInput<typeof StockMovementUseCase>;
