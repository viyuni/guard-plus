import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTransactions } from './point-transaction';
import { pointTypes } from './point-type';
import { productDeliveryTypeEnum, products } from './product';
import { users } from './user';

/**
 * 订单状态枚举
 * 状态流转:
 * 1. pending -> completed
 * 2. completed -> refunded
 */
export const orderStatusEnum = pgEnum('order_status', [
  /**
   * 待完成
   *
   * 用户已兑换，积分已扣除，商品库存已扣减
   * 等待管理员履约/处理
   */
  'pending',

  /**
   * 已完成
   *
   * 订单已履约完成
   */
  'completed',

  /**
   * 已退款
   *
   * 管理员退款后，积分已返还
   */
  'refunded',
]);

/**
 * 兑换订单表
 * - 不允许删除
 * 一个订单兑换一个商品，只使用一种积分
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 订单号
     */
    orderNo: text('order_no').notNull().unique('reward_orders_order_no_unique'),

    /**
     * 用户 ID
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    /**
     * 商品 ID
     */
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    /**
     * 积分类型 ID
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 实际扣除积分数量
     */
    price: integer('price').notNull(),

    /**
     * 商品名称快照
     */
    productNameSnapshot: text('product_name_snapshot').notNull(),

    /**
     * 自动发货内容快照
     *
     * 用于自动发货商品兑换后展示下载链接、兑换码等内容。
     */
    productDeliveryContentSnapshot: text('product_delivery_content_snapshot'),

    /**
     * 积分类型名称快照
     */
    pointTypeNameSnapshot: text('point_type_name_snapshot').notNull(),

    /**
     * 商品处理方式快照
     */
    deliveryTypeSnapshot: productDeliveryTypeEnum('delivery_type_snapshot').notNull(),

    /**
     * 扣积分流水 ID
     */
    consumeTransactionId: uuid('consume_transaction_id').references(() => pointTransactions.id),

    /**
     * 返还积分流水 ID
     */
    refundTransactionId: uuid('refund_transaction_id').references(() => pointTransactions.id),

    /**
     * 订单状态
     */
    status: orderStatusEnum('status').notNull().default('pending'),

    /**
     * 收货人手机号加密
     */
    receiverPhoneEncrypted: text('receiver_phone_encrypted'),

    /**
     * 收货人姓名加密
     */
    receiverAddressEncrypted: text('receiver_address_encrypted'),

    /**
     * 用户备注
     */
    userRemark: text('user_remark'),

    /**
     * 退款原因
     */
    refundReason: text('refund_reason'),

    /**
     * 完成时间
     */
    completedAt: timestamp('completed_at', { withTimezone: true }),

    /**
     * 退款时间
     */
    refundedAt: timestamp('refunded_at', { withTimezone: true }),

    /**
     * 幂等键
     */
    idempotencyKey: text('idempotency_key').notNull(),

    /**
     * 快递公司
     */
    expressCompany: text('express_company'),

    /**
     * 快递单号
     */
    expressNo: text('express_no'),

    /**
     * 订单元数据
     */
    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('reward_orders_user_id_idempotency_key_unique').on(t.userId, t.idempotencyKey),
    index('reward_orders_user_id_idx').on(t.userId),
    index('reward_orders_product_id_idx').on(t.productId),
    index('reward_orders_point_type_id_idx').on(t.pointTypeId),
    index('reward_orders_status_idx').on(t.status),
    index('reward_orders_created_at_idx').on(t.createdAt),
    index('reward_orders_user_created_at_idx').on(t.userId, t.createdAt),
    index('reward_orders_status_created_at_idx').on(t.status, t.createdAt),
    index('reward_orders_user_status_created_at_idx').on(t.userId, t.status, t.createdAt),
  ],
);

export type OrderStatus = InferEnum<typeof orderStatusEnum>;
export type Order = InferSelectModel<typeof orders>;
export type InsertOrder = InferInsertModel<typeof orders>;
export type UpdateOrder = Partial<InsertOrder>;
