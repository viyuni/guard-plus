import { isNull, type InferEnum, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
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

import { deletedAt, timestamps } from './column-helpers';
import { pointTypes } from './point-type';

/**
 * 商品状态
 */
export const productStatusEnum = pgEnum('reward_product_status', [
  /**
   * 上架，用户可兑换
   */
  'active',

  /**
   * 监修中，用户可见但不可兑换
   */
  'reviewing',

  /**
   * 下架，用户不可兑换
   */
  'disabled',
]);

/**
 * 商品发货方式
 */
export const productDeliveryTypeEnum = pgEnum('product_delivery_type', [
  /**
   * 手动发货 / 人工处理
   */
  'manual',

  /**
   * 自动发货
   */
  'automatic',
]);

/**
 * 商品表
 *
 * - 一个商品只能使用一种积分兑换
 * - 仅支持软删除
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * 商品名称
     */
    name: text('name').notNull(),

    /**
     * 商品描述
     */
    description: text('description'),

    /**
     * 商品封面图
     * 全部统一512x512
     */
    cover: text('cover'),

    /**
     * 商品详情
     *
     * 可以存 Markdown / 富文本 JSON 字符串 / HTML
     */
    detail: text('detail'),

    /**
     * 自动发货内容
     *
     * 可以存下载链接、兑换码等仅在兑换成功后展示的信息。
     */
    deliveryContent: text('delivery_content'),

    /**
     * 兑换所需积分类型
     */
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id),

    /**
     * 兑换所需积分数量
     */
    price: integer('price').notNull(),

    /**
     * 商品状态
     */
    status: productStatusEnum('status').notNull().default('disabled'),

    /**
     * 库存
     */
    stock: integer('stock').notNull().default(0),

    /**
     * 发货方式
     *
     * automatic: 兑换后自动发放，订单可直接 completed
     * manual: 兑换后创建已完成订单，等待线下/人工履约
     */
    deliveryType: productDeliveryTypeEnum('delivery_type').notNull().default('manual'),

    /**
     * 可兑换开始时间为空表示不限制开始时间
     */
    startAt: timestamp('start_at', { withTimezone: true }),

    /**
     * 可兑换结束时间为空表示不限制结束时间
     */
    endAt: timestamp('end_at', { withTimezone: true }),

    /**
     * 排序
     * 空值排在最前，非空时值越大越靠前
     */
    sort: integer('sort'),

    metadata: jsonb('metadata'),

    deletedAt,

    ...timestamps,
  },
  t => [
    uniqueIndex('products_name_active_unique').on(t.name).where(isNull(t.deletedAt)),
    index('products_point_type_id_idx').on(t.pointTypeId),
    index('products_status_idx').on(t.status),
    index('products_time_range_idx').on(t.startAt, t.endAt),
    index('products_sort_idx').on(t.sort),
    index('products_deleted_at_idx').on(t.deletedAt),
    index('products_active_list_idx').on(t.status, t.sort, t.createdAt).where(isNull(t.deletedAt)),
    index('products_point_type_list_idx')
      .on(t.pointTypeId, t.sort, t.createdAt)
      .where(isNull(t.deletedAt)),
    index('products_delivery_type_list_idx')
      .on(t.deliveryType, t.sort, t.createdAt)
      .where(isNull(t.deletedAt)),
  ],
);

export type ProductStatus = InferEnum<typeof productStatusEnum>;
export type ProductDeliveryType = InferEnum<typeof productDeliveryTypeEnum>;
export type Product = InferSelectModel<typeof products>;
export type InsertProduct = InferInsertModel<typeof products>;
export type UpdateProduct = Partial<InsertProduct>;
