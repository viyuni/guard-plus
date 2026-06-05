import * as v from 'valibot';

import {
  dateRange,
  emptyable,
  nonce,
  pageQuery,
  POSTGRES_INTEGER_MAX,
  POSTGRES_INTEGER_MIN,
  remark,
} from './common';

/**
 * 库存变动类型。
 */
export const StockMovementType = {
  Consume: 'consume',
  Restore: 'restore',
  Adjust: 'adjust',
} as const;

/**
 * 库存变动类型 Schema。
 */
export const StockMovementTypeSchema = v.pipe(
  v.enum(StockMovementType, '请选择有效的库存变动类型'),
  v.description('库存变动类型'),
);

export type StockMovementType = v.InferOutput<typeof StockMovementTypeSchema>;

/**
 * 非零整数 Schema。
 *
 * 用于表示库存调整增量：
 * - 大于 0：增加库存
 * - 小于 0：减少库存
 * - 不允许为 0
 */
const NonZeroIntegerSchema = v.pipe(
  v.number('请输入库存调整数量'),
  v.integer('库存调整数量必须是整数'),
  v.minValue(POSTGRES_INTEGER_MIN, '库存调整数量过小'),
  v.maxValue(POSTGRES_INTEGER_MAX, '库存调整数量过大'),
  v.check(value => value !== 0, '库存调整数量不能为 0'),
  v.description('库存调整数量'),
);

/**
 * 库存流水分页查询 Query Schema。
 *
 * 用于按商品、库存变动类型、时间范围分页查询库存流水。
 */
export const StockMovementPageQuerySchema = v.object({
  type: v.optional(StockMovementTypeSchema),
  productId: v.optional(v.pipe(v.string('请输入商品 ID'), v.description('商品 ID'))),
  ...dateRange.entries,
  ...pageQuery.entries,
});

export type StockMovementPageQuery = v.InferOutput<typeof StockMovementPageQuerySchema>;

/**
 * 库存调整 Body Schema。
 *
 * 用于管理员手动调整商品库存。
 */
export const StockAdjustmentSchema = v.object({
  nonce: nonce,
  delta: NonZeroIntegerSchema,
  remark: v.optional(emptyable(remark)),
});

export type StockAdjustmentBody = v.InferOutput<typeof StockAdjustmentSchema>;
