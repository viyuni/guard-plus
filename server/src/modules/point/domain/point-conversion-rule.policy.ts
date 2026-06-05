import type { PointConversionRule } from '#db/schema';

import { PointConversionRuleInvalidError, PointConversionRuleUnavailableError } from './errors';
import { PointAmountPolicy } from './point-amount.policy';

export class PointConversionRulePolicy {
  static assertValidShape(input: {
    fromPointTypeId?: string;
    toPointTypeId?: string;
    toAmount?: number;
    minConvertAmount?: number | null;
    maxConvertAmount?: number | null;
    startAt?: Date | null;
    endAt?: Date | null;
  }) {
    if (
      input.fromPointTypeId !== undefined &&
      input.toPointTypeId !== undefined &&
      input.fromPointTypeId === input.toPointTypeId
    ) {
      throw new PointConversionRuleInvalidError('来源积分类型和目标积分类型不能相同');
    }

    if (input.toAmount !== undefined && input.toAmount <= 0) {
      throw new PointConversionRuleInvalidError('目标积分数量必须大于 0');
    }

    if (
      input.minConvertAmount !== undefined &&
      input.maxConvertAmount !== undefined &&
      input.minConvertAmount !== null &&
      input.maxConvertAmount !== null &&
      input.minConvertAmount > input.maxConvertAmount
    ) {
      throw new PointConversionRuleInvalidError('最小转换数量不能大于最大转换数量');
    }

    if (
      input.startAt !== undefined &&
      input.endAt !== undefined &&
      input.startAt !== null &&
      input.endAt !== null &&
      input.startAt >= input.endAt
    ) {
      throw new PointConversionRuleInvalidError('生效时间必须早于失效时间');
    }
  }

  static assertAvailable(rule: PointConversionRule, now = new Date()) {
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

  static calculateToAmount(rule: PointConversionRule, convertAmount: number) {
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

    PointAmountPolicy.assertPositiveInteger(toAmount);

    return toAmount;
  }
}
