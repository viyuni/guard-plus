import { describe, expect, it } from 'bun:test';

import type { Order } from '#db/schema';

import { OrderStatusInvalidError } from '../domain';
import { OrderPolicy } from '../domain';

function order(input: Partial<Order> = {}): Order {
  return {
    id: crypto.randomUUID(),
    orderNo: `order_${crypto.randomUUID()}`,
    userId: crypto.randomUUID(),
    productId: crypto.randomUUID(),
    pointTypeId: crypto.randomUUID(),
    price: 1,
    productNameSnapshot: '商品',
    productDeliveryContentSnapshot: null,
    pointTypeNameSnapshot: '积分',
    deliveryTypeSnapshot: 'manual',
    consumeTransactionId: null,
    refundTransactionId: null,
    status: 'pending',
    receiverPhoneEncrypted: null,
    receiverAddressEncrypted: null,
    userRemark: null,
    refundReason: null,
    completedAt: null,
    refundedAt: null,
    expressCompany: null,
    expressNo: null,
    idempotencyKey: `order:${crypto.randomUUID()}`,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('订单策略', () => {
  it('根据发货方式决定初始订单状态', () => {
    expect(OrderPolicy.initialStatusForDeliveryType('automatic')).toBe('completed');
    expect(OrderPolicy.initialStatusForDeliveryType('manual')).toBe('pending');
  });

  it('只允许待完成订单完成', () => {
    expect(() => OrderPolicy.assertCanComplete(order({ status: 'pending' }))).not.toThrow();
    expect(() => OrderPolicy.assertCanComplete(order({ status: 'completed' }))).toThrow(
      OrderStatusInvalidError,
    );
  });

  it('只允许待完成或已完成订单退款', () => {
    expect(() => OrderPolicy.assertCanRefund(order({ status: 'pending' }))).not.toThrow();
    expect(() => OrderPolicy.assertCanRefund(order({ status: 'completed' }))).not.toThrow();
    expect(() => OrderPolicy.assertCanRefund(order({ status: 'refunded' }))).toThrow(
      OrderStatusInvalidError,
    );
  });
});
