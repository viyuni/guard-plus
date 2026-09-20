import { createIntegerPolicy } from '#utils';

import { StockAmountInvalidError } from './errors';

const integerPolicy = createIntegerPolicy({
  label: '商品库存',
  createError: message => new StockAmountInvalidError(message),
});

export const assertStockAmountInteger = integerPolicy.assertIsInteger;
export const assertPositiveStockAmount = integerPolicy.assertPositiveInteger;
export const assertNonZeroStockAmount = integerPolicy.assertNonZeroInteger;
export const assertStockAmountCanAdd = integerPolicy.assertCanAdd;
