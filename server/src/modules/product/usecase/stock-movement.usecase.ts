import type { StockMovementPageQuery } from '@shared/schema/stock';

import { StockMovementRepository } from '../repository';

export interface StockMovementUseCaseDeps {
  stockMovementRepo: StockMovementRepository;
}

export class StockMovementUseCase {
  constructor(private readonly deps: StockMovementUseCaseDeps) {}

  /**
   * 获取库存变动
   */
  page(query: StockMovementPageQuery) {
    return this.deps.stockMovementRepo.page(query);
  }
}
