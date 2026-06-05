import { describe, expect, it } from 'bun:test';

import type { PointType } from '#db/schema';

import { PointTypePolicy } from '../domain';

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
    expect(PointTypePolicy.shouldEnable(pointType({ status: 'disabled' }))).toBe(true);
    expect(PointTypePolicy.shouldEnable(pointType({ status: 'active' }))).toBe(false);
    expect(PointTypePolicy.shouldDisable(pointType({ status: 'active' }))).toBe(true);
    expect(PointTypePolicy.shouldDisable(pointType({ status: 'disabled' }))).toBe(false);
  });
});
