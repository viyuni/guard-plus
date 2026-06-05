import { IntegerValuePolicy } from '#utils/number';

import { PointAmountInvalidError } from './errors';

export class PointAmountPolicy extends IntegerValuePolicy {
  protected static override label = '积分数量';

  protected static override createError(message: string) {
    return new PointAmountInvalidError(message);
  }
}
