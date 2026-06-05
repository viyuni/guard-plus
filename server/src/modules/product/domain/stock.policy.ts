import type { Product } from '#db/schema';

import { StockInsufficientError } from './errors';

export class StockPolicy {
  static assertSufficientStock(product: Product, amount: number) {
    if (product.stock < amount) {
      throw new StockInsufficientError();
    }
  }
}
