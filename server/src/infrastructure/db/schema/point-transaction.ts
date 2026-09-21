import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointAccounts } from './point-account';
import { pointTypes } from './point-type';
import { users } from './user';

/**
 * 积分流水类型
 */
export const pointTransactionTypeEnum = pgEnum('point_transaction_type', [
  /**
   * 发放积分
   */
  'grant',

  /**
   * 消费积分
   */
  'consume',

  /**
   * 退款返还积分
   */
  'refund',

  /**
   * 管理员手动调整
   */
  'adjust',

  /**
   * 冲正流水
   */
  'reversal',
]);

/**
 * 积分流水表
 *
 * - 所有积分变动都必须写入这里
 * - 不允许删除, 不可逆
 *
 * 约定:
 * - amount > 0 表示增加积分
 * - amount < 0 表示扣除积分
 * - 不物理删除流水
 * - 修正错误用 reversal 冲正
 */
export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 用户 ID
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    /**
     * 积分账户 ID
     */
    pointAccountId: uuid('account_id')
      .notNull()
      .references(() => pointAccounts.id),

    /**
     * 积分类型 ID
     *
     * 冗余一份 pointTypeId 是为了查询流水时不用总是 join account
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 积分类型名称快照
     */
    pointTypeNameSnapshot: text('point_type_name_snapshot').notNull(),

    /**
     * 流水类型
     */
    type: pointTransactionTypeEnum('type').notNull(),

    /**
     * 变动数量
     *
     * 发放: 正数
     * 消费: 负数
     * 退款: 正数
     * 冲正: 根据被冲正流水反向写入
     */
    delta: integer('delta').notNull(),

    /**
     * 变动前余额
     */
    balanceBefore: integer('balance_before').notNull(),

    /**
     * 变动后余额
     */
    balanceAfter: integer('balance_after').notNull(),

    /**
     * 来源类型
     *
     * @example
     * 'live_event'
     * 'reward_order'
     * 'admin_adjustment'
     * 'order_refund'
     */
    sourceType: text('source_type'),

    /**
     * 来源 ID
     *
     * 示例:
     * 订单 ID、直播事件 ID、管理员操作 ID
     */
    sourceId: text('source_id'),

    /**
     * 幂等键
     *
     * 用于避免重复发放、重复扣款、重复退款
     *
     * @example
     * 'guard_event:bilibili:xxxx'
     * 'reward_order:orderId:consume'
     * 'reward_order:orderId:refund'
     */
    idempotencyKey: text('idempotency_key').notNull(),

    /**
     * 流水备注
     *
     * @example
     * '兑换商品: 钥匙扣'
     * '管理员补发积分'
     * '订单退款返还积分'
     */
    remark: text('remark'),

    /**
     * 原始上下文
     *
     * 可以保存事件 payload、订单快照、管理员信息等
     */
    metadata: jsonb('metadata'),

    /**
     * 如果这是冲正流水，指向被冲正的流水
     */
    reversalOfTransactionId: uuid('reversal_of_transaction_id'),

    ...timestamps,
  },
  t => [
    uniqueIndex('point_transactions_account_id_idempotency_key_unique').on(
      t.pointAccountId,
      t.idempotencyKey,
    ),

    uniqueIndex('point_transactions_reversal_of_transaction_id_unique').on(
      t.reversalOfTransactionId,
    ),

    index('point_transactions_user_id_idx').on(t.userId),
    index('point_transactions_point_account_id_idx').on(t.pointAccountId),
    index('point_transactions_point_type_id_idx').on(t.pointTypeId),
    index('point_transactions_type_idx').on(t.type),
    index('point_transactions_source_idx').on(t.sourceType, t.sourceId),
    index('point_transactions_created_at_idx').on(t.createdAt),
    index('point_transactions_user_created_at_idx').on(t.userId, t.createdAt),
    index('point_transactions_user_type_created_at_idx').on(t.userId, t.type, t.createdAt),
    index('point_transactions_user_point_type_created_at_idx').on(
      t.userId,
      t.pointTypeId,
      t.createdAt,
    ),
  ],
);

export type PointTransactionType = InferEnum<typeof pointTransactionTypeEnum>;
export type PointTransaction = InferSelectModel<typeof pointTransactions>;
export type InsertPointTransaction = InferInsertModel<typeof pointTransactions>;
export type UpdatePointTransaction = Partial<InsertPointTransaction>;
