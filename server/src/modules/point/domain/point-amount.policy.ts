import { createIntegerPolicy } from '#shared';

import { PointAmountInvalidError } from './errors';

const integerPolicy = createIntegerPolicy({
  label: '积分数量',
  createError: message => new PointAmountInvalidError(message),
});

export const assertPointAmountInteger = integerPolicy.assertIsInteger;
export const assertPositivePointAmount = integerPolicy.assertPositiveInteger;
export const assertNonZeroPointAmount = integerPolicy.assertNonZeroInteger;
export const assertPointAmountCanAdd = integerPolicy.assertCanAdd;
