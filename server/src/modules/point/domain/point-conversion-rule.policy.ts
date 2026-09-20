import type { PointConversionRule } from '#db/schema';
import { assertTimeRange } from '#utils';

import { PointConversionRuleInvalidError, PointConversionRuleUnavailableError } from './errors';
import { assertPositivePointAmount } from './point-amount.policy';

function assertDistinctPointTypes(fromPointTypeId?: string, toPointTypeId?: string) {
  if (
    fromPointTypeId !== undefined &&
    toPointTypeId !== undefined &&
    fromPointTypeId === toPointTypeId
  ) {
    throw new PointConversionRuleInvalidError('来源积分类型和目标积分类型不能相同');
  }
}

function assertPositiveToAmount(toAmount?: number) {
  if (toAmount !== undefined && toAmount <= 0) {
    throw new PointConversionRuleInvalidError('目标积分数量必须大于 0');
  }
}

function assertConvertAmountRange(
  minConvertAmount?: number | null,
  maxConvertAmount?: number | null,
) {
  if (
    minConvertAmount === undefined ||
    maxConvertAmount === undefined ||
    minConvertAmount === null ||
    maxConvertAmount === null
  ) {
    return;
  }

  if (minConvertAmount > maxConvertAmount) {
    throw new PointConversionRuleInvalidError('最小转换数量不能大于最大转换数量');
  }
}

export function assertPointConversionRuleShape(input: {
  fromPointTypeId?: string;
  toPointTypeId?: string;
  toAmount?: number;
  minConvertAmount?: number | null;
  maxConvertAmount?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
}) {
  assertDistinctPointTypes(input.fromPointTypeId, input.toPointTypeId);
  assertPositiveToAmount(input.toAmount);
  assertConvertAmountRange(input.minConvertAmount, input.maxConvertAmount);
  assertTimeRange(
    input.startAt,
    input.endAt,
    () => new PointConversionRuleInvalidError('生效时间必须早于失效时间'),
  );
}

export function assertPointConversionRuleAvailable(rule: PointConversionRule, now = new Date()) {
  if (!rule.enabled) {
    throw new PointConversionRuleUnavailableError('积分转换规则已停用');
  }

  if (rule.startAt && rule.startAt > now) {
    throw new PointConversionRuleUnavailableError('积分转换规则尚未生效');
  }

  if (rule.endAt && rule.endAt <= now) {
    throw new PointConversionRuleUnavailableError('积分转换规则已失效');
  }
}

export function calculatePointConversionToAmount(rule: PointConversionRule, convertAmount: number) {
  if (convertAmount <= 0) {
    throw new PointConversionRuleInvalidError('转换数量必须大于 0');
  }

  if (rule.minConvertAmount !== null && convertAmount < rule.minConvertAmount) {
    throw new PointConversionRuleInvalidError(`转换数量不能小于 ${rule.minConvertAmount}`);
  }

  if (rule.maxConvertAmount !== null && convertAmount > rule.maxConvertAmount) {
    throw new PointConversionRuleInvalidError(`转换数量不能大于 ${rule.maxConvertAmount}`);
  }

  const toAmount = convertAmount * rule.toAmount;

  assertPositivePointAmount(toAmount);

  return toAmount;
}
