import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, uuid, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTypes } from './point-type';

/**
 * - active 正常，可获得、可消费
 * - suspended 暂停，可获得积分、不可消费，可用于暂时限制兑换
 * - banned 封禁，不可获得积分、不可消费
 */
export const pointAccountStatusEnum = pgEnum('point_account_status', [
  'active',
  'suspended',
  'banned',
]);

/**
 * 用户积分账户表
 *
 * 一个用户针对一种积分类型只有一个账户
 */
export const pointAccounts = pgTable(
  'point_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 用户 ID
     */
    userId: uuid('user_id').notNull(),

    /**
     * 积分类型 ID
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 当前可用余额
     */
    balance: integer('balance').notNull().default(0),

    /**
     * 账户状态
     */
    status: pointAccountStatusEnum('status').notNull().default('active'),

    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('point_accounts_user_id_point_type_id_unique_idx').on(t.userId, t.pointTypeId),
    index('point_accounts_user_id_idx').on(t.userId),
    index('point_accounts_point_type_id_idx').on(t.pointTypeId),
  ],
);

export type PointAccountStatus = InferEnum<typeof pointAccountStatusEnum>;
export type PointAccount = InferSelectModel<typeof pointAccounts>;
export type InsertPointAccount = InferInsertModel<typeof pointAccounts>;
export type UpdatePointAccount = Partial<InsertPointAccount>;
