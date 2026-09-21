import { isNull, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { deletedAt, timestamps } from './column-helpers';
import { pointTypes } from './point-type';

/**
 * 积分转换规则表
 * - 不允许删除
 *
 * 示例:
 * 1 总督积分 -> 10 舰长积分
 */
export const pointConversionRules = pgTable(
  'point_conversion_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 显示名称
     *
     * 示例:
     * 督级积分兑换舰级积分
     */
    name: text('name').notNull(),

    /**
     * 描述
     */
    description: text('description'),

    /**
     * 备注
     */
    remark: text('remark'),

    /**
     * 来源积分类型
     */
    fromPointTypeId: uuid('from_point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 目标积分类型
     */
    toPointTypeId: uuid('to_point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 每 1 个来源积分可兑换的目标积分数量
     *
     * 例如:
     * 1 总督积分 -> 10 舰长积分
     * toAmount = 10
     */
    toAmount: integer('to_amount').notNull(),

    /**
     * 单次最小转换数量
     *
     * null 表示不限制
     */
    minConvertAmount: integer('min_convert_amount'),

    /**
     * 单次最大转换数量
     *
     * null 表示不限制
     */
    maxConvertAmount: integer('max_convert_amount'),

    /**
     * 是否启用
     */
    enabled: boolean('enabled').notNull().default(true),

    /**
     * 生效时间范围, null 表示永久有效
     */
    startAt: timestamp('start_at', { withTimezone: true }),

    /**
     * 失效时间范围, null 表示永久有效
     */
    endAt: timestamp('end_at', { withTimezone: true }),

    metadata: jsonb('metadata'),

    deletedAt,

    ...timestamps,
  },
  t => [
    uniqueIndex('point_conversion_rules_active_unique').on(t.name).where(isNull(t.deletedAt)),
    uniqueIndex('point_conversion_rules_from_to_unique_idx')
      .on(t.fromPointTypeId, t.toPointTypeId)
      .where(isNull(t.deletedAt)),
    index('point_conversion_rules_from_point_type_id_idx').on(t.fromPointTypeId),
    index('point_conversion_rules_to_point_type_id_idx').on(t.toPointTypeId),
    index('point_conversion_rules_enabled_idx').on(t.enabled),
    index('point_conversion_rules_time_range_idx').on(t.startAt, t.endAt),
  ],
);

export type PointConversionRule = InferSelectModel<typeof pointConversionRules>;
export type InsertPointConversionRule = InferInsertModel<typeof pointConversionRules>;
export type UpdatePointConversionRule = Partial<InsertPointConversionRule>;
