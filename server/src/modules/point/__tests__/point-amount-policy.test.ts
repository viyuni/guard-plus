import { describe, expect, it } from 'bun:test';

import type { PointConversionRule } from '#db/schema';
import { PointAmountPolicy, PointConversionRulePolicy } from '#modules/point';

function conversionRule(input: Partial<PointConversionRule> = {}): PointConversionRule {
  return {
    id: crypto.randomUUID(),
    name: '测试积分转换',
    description: null,
    remark: null,
    fromPointTypeId: crypto.randomUUID(),
    toPointTypeId: crypto.randomUUID(),
    toAmount: 1,
    minConvertAmount: null,
    maxConvertAmount: null,
    enabled: true,
    startAt: null,
    endAt: null,
    metadata: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('积分数量策略', () => {
  it('拒绝超出 PostgreSQL integer 范围的积分数量', () => {
    expect(() => PointAmountPolicy.assertPositiveInteger(2_147_483_647)).not.toThrow();
    expect(() => PointAmountPolicy.assertPositiveInteger(2_147_483_648)).toThrow(
      '积分数量超出整数范围',
    );
  });

  it('拒绝转换后超出 PostgreSQL integer 范围的目标积分数量', () => {
    const rule = conversionRule({ toAmount: 2 });

    expect(() => PointConversionRulePolicy.calculateToAmount(rule, 1_073_741_823)).not.toThrow();
    expect(() => PointConversionRulePolicy.calculateToAmount(rule, 1_073_741_824)).toThrow(
      '积分数量超出整数范围',
    );
  });
});
