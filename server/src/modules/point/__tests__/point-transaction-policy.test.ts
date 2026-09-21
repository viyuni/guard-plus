import { describe, expect, it } from 'bun:test';

import type { PointTransaction } from '#infrastructure/db/schema';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointTransactionAlreadyReversedError,
  assertPointTransactionCanReverse,
  reversalPointTransactionDelta,
  resolvePointTransactionTitle,
} from '../domain';

function transaction(input: Partial<PointTransaction> = {}): PointTransaction {
  return {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    pointAccountId: crypto.randomUUID(),
    pointTypeId: crypto.randomUUID(),
    pointTypeNameSnapshot: '积分',
    type: 'consume',
    delta: -1,
    balanceBefore: 10,
    balanceAfter: 9,
    sourceType: POINT_CHANGE_SOURCE_TYPE.OrderConsume,
    sourceId: crypto.randomUUID(),
    idempotencyKey: `point:${crypto.randomUUID()}`,
    remark: null,
    metadata: null,
    reversalOfTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('积分流水策略', () => {
  it('阻止重复冲正', () => {
    expect(() => assertPointTransactionCanReverse(transaction(), null)).not.toThrow();
    expect(() =>
      assertPointTransactionCanReverse(
        transaction({ reversalOfTransactionId: crypto.randomUUID() }),
        null,
      ),
    ).toThrow(PointTransactionAlreadyReversedError);
    expect(() =>
      assertPointTransactionCanReverse(transaction(), transaction({ type: 'reversal' })),
    ).toThrow(PointTransactionAlreadyReversedError);
  });

  it('计算冲正反向 delta', () => {
    expect(reversalPointTransactionDelta(transaction({ delta: -7 }))).toBe(7);
    expect(reversalPointTransactionDelta(transaction({ delta: 7 }))).toBe(-7);
  });

  it('根据来源和类型生成展示标题', () => {
    expect(
      resolvePointTransactionTitle({
        type: 'consume',
        delta: -1,
        sourceType: POINT_CHANGE_SOURCE_TYPE.OrderConsume,
      }),
    ).toBe('兑换商品');
    expect(
      resolvePointTransactionTitle({
        type: 'adjust',
        delta: -1,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
      }),
    ).toBe('管理员扣减');
    expect(
      resolvePointTransactionTitle({
        type: 'grant',
        delta: 1,
        sourceType: null,
      }),
    ).toBe('获得积分');
  });
});
