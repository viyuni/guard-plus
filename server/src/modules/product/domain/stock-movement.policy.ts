import type { ProductStockMovementType } from '#db/schema';

import { InvalidStockMovementDeltaError } from './errors';

export class StockMovementPolicy {
  static assertDeltaMatchesType(type: ProductStockMovementType, delta: number) {
    if (type === 'consume' && delta >= 0) {
      throw new InvalidStockMovementDeltaError('消耗库存 delta 必须小于 0');
    }

    if (type === 'restore' && delta <= 0) {
      throw new InvalidStockMovementDeltaError('恢复库存 delta 必须大于 0');
    }

    if (type === 'adjust' && delta === 0) {
      throw new InvalidStockMovementDeltaError('调整库存 delta 不能为 0');
    }
  }
}
