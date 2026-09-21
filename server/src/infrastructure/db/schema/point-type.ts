import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';

/**
 * 积分类型状态
 */
export const pointTypeStatusEnum = pgEnum('point_type_status', ['active', 'disabled']);

/**
 * 积分类型表
 * - 仅支持软删除
 *
 * Example:
 * - captain_point 舰长积分
 * - admiral_point 提督积分
 * - governor_point 总督积分
 * - activity_point 活动积分
 */
export const pointTypes = pgTable(
  'point_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 展示名称
     *
     * Example:
     * 舰长积分
     */
    name: text('name').notNull().unique(),

    /**
     * 积分说明
     */
    description: text('description'),

    /**
     * 图标
     *
     * 可以存 icon name
     */
    icon: text('icon'),

    /**
     * 状态
     *
     * active: 可用
     * disabled 后历史数据仍可查询，但不允许继续发放、兑换、转换
     */
    status: pointTypeStatusEnum('status').notNull().default('active'),

    /**
     * 排序值，空值排在最前，非空时值越大越靠前
     */
    sort: integer('sort'),

    ...timestamps,
  },
  t => [index('point_types_status_idx').on(t.status), index('point_types_sort_idx').on(t.sort)],
);

export type PointTypeStatus = InferEnum<typeof pointTypeStatusEnum>;
export type PointType = InferSelectModel<typeof pointTypes>;
export type InsertPointType = InferInsertModel<typeof pointTypes>;
export type UpdatePointType = Partial<InsertPointType>;
