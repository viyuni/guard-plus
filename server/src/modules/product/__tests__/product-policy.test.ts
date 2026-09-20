import { describe, expect, it } from 'bun:test';

import type { Product } from '#db/schema';

import {
  isProductAvailable,
  assertProductAvailable,
  shouldActivateProduct,
  shouldDisableProduct,
  ProductUnavailableError,
} from '../domain';

function product(input: Partial<Product> = {}): Product {
  return {
    id: crypto.randomUUID(),
    code: crypto.randomUUID(),
    name: `product_${crypto.randomUUID()}`,
    description: null,
    cover: null,
    detail: null,
    deliveryContent: null,
    pointTypeId: crypto.randomUUID(),
    price: 1,
    status: 'active',
    stock: 1,
    deliveryType: 'manual',
    startAt: null,
    endAt: null,
    sort: 0,
    metadata: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('商品策略', () => {
  it('识别可兑换商品', () => {
    expect(isProductAvailable(product({ status: 'active' }))).toBe(true);
    expect(() => assertProductAvailable(product({ status: 'active' }))).not.toThrow();
  });

  it('拒绝下架商品兑换', () => {
    expect(isProductAvailable(product({ status: 'disabled' }))).toBe(false);
    expect(() => assertProductAvailable(product({ status: 'disabled' }))).toThrow(
      ProductUnavailableError,
    );
  });

  it('拒绝监修中商品兑换', () => {
    expect(isProductAvailable(product({ status: 'reviewing' }))).toBe(false);
    expect(() => assertProductAvailable(product({ status: 'reviewing' }))).toThrow(
      ProductUnavailableError,
    );
  });

  it('按可兑换时间窗口判断商品是否可兑换', () => {
    const now = new Date('2026-05-19T12:00:00.000Z');
    const windowStartAt = new Date('2026-05-19T11:00:00.000Z');
    const windowEndAt = new Date('2026-05-19T13:00:00.000Z');
    const startAfterNow = new Date('2026-05-19T13:00:00.000Z');
    const endBeforeNow = new Date('2026-05-19T12:00:00.000Z');

    expect(isProductAvailable(product({ startAt: windowStartAt, endAt: windowEndAt }), now)).toBe(
      true,
    );

    expect(isProductAvailable(product({ startAt: startAfterNow }), now)).toBe(false);
    expect(isProductAvailable(product({ endAt: endBeforeNow }), now)).toBe(false);
  });

  it('判断上下架操作是否需要写库', () => {
    expect(shouldActivateProduct(product({ status: 'disabled' }))).toBe(true);
    expect(shouldActivateProduct(product({ status: 'active' }))).toBe(false);
    expect(shouldDisableProduct(product({ status: 'active' }))).toBe(true);
    expect(shouldDisableProduct(product({ status: 'disabled' }))).toBe(false);
  });
});
