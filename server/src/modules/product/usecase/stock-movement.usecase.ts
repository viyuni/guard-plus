import type { StockMovementPageQuery } from '@shared/schema/stock';
import { type InferInput, ripple } from 'cyrenejs';

import { stockMovementRepo } from '../repository';

export const stockMovementUseCase = ripple(
  {
    stockMovementRepo,
  },
  ({ stockMovementRepo }) => ({
    /**
     * 获取库存变动
     */
    page(query: StockMovementPageQuery) {
      return stockMovementRepo.page(query);
    },
  }),
  { debugName: 'StockMovementUseCase' },
);

export type StockMovementUseCase = InferInput<typeof stockMovementUseCase>;
