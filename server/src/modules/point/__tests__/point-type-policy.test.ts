import { describe, expect, it } from 'bun:test';

import type { PointType } from '#db/schema';

import { shouldEnablePointType, shouldDisablePointType } from '../domain';

function pointType(input: Partial<PointType> = {}): PointType {
  return {
    id: crypto.randomUUID(),
    name: `point_${crypto.randomUUID()}`,
    description: null,
    icon: null,
    status: 'active',
    sort: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('积分类型策略', () => {
  it('判断启停操作是否需要写库', () => {
    expect(shouldEnablePointType(pointType({ status: 'disabled' }))).toBe(true);
    expect(shouldEnablePointType(pointType({ status: 'active' }))).toBe(false);
    expect(shouldDisablePointType(pointType({ status: 'active' }))).toBe(true);
    expect(shouldDisablePointType(pointType({ status: 'disabled' }))).toBe(false);
  });
});
