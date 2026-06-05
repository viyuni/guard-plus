import { IntegerValuePolicy } from '#utils/number';

import { StockAmountInvalidError } from './errors';

export class StockAmountPolicy extends IntegerValuePolicy {
  protected static override label = '商品库存';

  protected static override createError(message: string) {
    return new StockAmountInvalidError(message);
  }
}
