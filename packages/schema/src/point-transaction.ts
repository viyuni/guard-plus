import * as v from 'valibot';

import { dateRange, pageQuery } from './common';

/**
 * 积分流水 ID Params Schema。
 */
export const PointTransactionIdParamsSchema = v.object({
  id: v.pipe(v.string('请输入积分流水 ID'), v.description('积分流水 ID')),
});

export type PointTransactionIdParams = v.InferOutput<typeof PointTransactionIdParamsSchema>;

/**
 * 积分流水类型。
 */
export const PointTransactionType = {
  Grant: 'grant',
  Consume: 'consume',
  Refund: 'refund',
  Adjust: 'adjust',
  Reversal: 'reversal',
} as const;

/**
 * 积分流水类型 Schema。
 */
export const PointTransactionTypeSchema = v.pipe(
  v.enum(PointTransactionType, '请选择有效的积分流水类型'),
  v.description('积分流水类型'),
);

export type PointTransactionType = v.InferOutput<typeof PointTransactionTypeSchema>;

/**
 * 积分流水分页查询 Query Schema。
 */
export const TransactionPageQuerySchema = v.object({
  type: v.optional(PointTransactionTypeSchema),
  pointTypeId: v.optional(v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID'))),
  userId: v.optional(v.pipe(v.string('请输入用户 ID'), v.description('用户 ID'))),
  ...dateRange.entries,
  ...pageQuery.entries,
});

export type PointTransactionPageQuery = v.InferOutput<typeof TransactionPageQuerySchema>;
