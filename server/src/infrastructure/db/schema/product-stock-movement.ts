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
import { products } from './product';

/**
 * 商品库存变动类型
 */
export const productStockMovementTypeEnum = pgEnum('product_stock_movement_type', [
  /**
   * 用户兑换扣减库存
   */
  'consume',

  /**
   * 取消/退款后恢复库存
   */
  'restore',

  /**
   * 管理员手动调整库存
   */
  'adjust',
]);

/**
 * 商品库存变动表
 * - 不允许删除, 不可逆
 */
export const productStockMovements = pgTable(
  'product_stock_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    type: productStockMovementTypeEnum('type').notNull(),

    /**
     * 变动数量
     *
     * consume: -1
     * restore: +1
     * adjust: 可正可负
     */
    delta: integer('delta').notNull().notNull(),

    /**
     * 变动前库存
     */
    stockBefore: integer('stock_before').notNull(),

    /**
     * 变动后库存
     */
    stockAfter: integer('stock_after').notNull(),

    /**
     * 来源类型
     *
     * 示例:
     * rewardOrder
     * adminAdjustment
     */
    sourceType: text('source_type').notNull(),

    /**
     * 来源 ID
     *
     * 示例:
     * 订单 ID、管理员操作 ID
     */
    sourceId: text('source_id').notNull(),

    /**
     * 幂等键
     */
    idempotencyKey: text('idempotency_key').notNull(),

    /**
     * 备注
     */
    remark: text('remark'),

    /**
     * 元数据
     */
    metadata: jsonb('metadata'),

    ...timestamps,
  },
  t => [
    uniqueIndex('product_stock_transactions_idempotency_unique').on(
      t.productId,
      t.sourceType,
      t.sourceId,
      t.type,
      t.idempotencyKey,
    ),
    index('product_stock_transactions_product_id_idx').on(t.productId),
    index('product_stock_transactions_type_idx').on(t.type),
    index('product_stock_transactions_source_idx').on(t.sourceType, t.sourceId),
    index('product_stock_transactions_created_at_idx').on(t.createdAt),
    index('product_stock_transactions_product_created_at_idx').on(t.productId, t.createdAt),
    index('product_stock_transactions_product_type_created_at_idx').on(
      t.productId,
      t.type,
      t.createdAt,
    ),
  ],
);

export type ProductStockMovementType = InferEnum<typeof productStockMovementTypeEnum>;
export type ProductStockMovement = InferSelectModel<typeof productStockMovements>;
export type InsertProductStockMovement = InferInsertModel<typeof productStockMovements>;
export type UpdateProductStockMovement = Partial<InsertProductStockMovement>;
