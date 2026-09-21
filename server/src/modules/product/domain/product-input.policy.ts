import { assertTimeRange } from '#shared';

import { ProductInvalidInputError } from './errors';

const POSTGRES_INTEGER_MAX = 2_147_483_647;

function assertPositiveInteger(value: number, message: string) {
  if (!Number.isInteger(value) || value <= 0 || value > POSTGRES_INTEGER_MAX) {
    throw new ProductInvalidInputError(message);
  }
}

function assertNonNegativeInteger(value: number, message: string) {
  if (!Number.isInteger(value) || value < 0 || value > POSTGRES_INTEGER_MAX) {
    throw new ProductInvalidInputError(message);
  }
}

export function assertProductPrice(value: number | undefined) {
  if (value !== undefined) {
    assertPositiveInteger(value, '商品价格必须是正整数');
  }
}

export function assertProductStock(value: number | null | undefined) {
  if (value !== undefined && value !== null) {
    assertNonNegativeInteger(value, '商品库存必须是非负整数或不限库存');
  }
}

export function assertProductTimeRange(
  startAt: Date | null | undefined,
  endAt: Date | null | undefined,
) {
  assertTimeRange(
    startAt,
    endAt,
    () => new ProductInvalidInputError('商品开始时间必须早于结束时间'),
  );
}
