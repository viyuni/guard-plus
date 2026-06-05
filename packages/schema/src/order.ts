import * as v from 'valibot';

import { dateRange, emptyable, keyword, nonce, pageQuery } from './common';

/**
 * 订单 ID Params Schema
 */
export const OrderIdParamsSchema = v.object({
  orderId: v.pipe(v.string('请输入订单ID'), v.description('订单ID')),
});

/**
 * 订单状态
 */
export const OrderStatus = {
  Pending: 'pending',
  Completed: 'completed',
  Refunded: 'refunded',
} as const;

/**
 * 订单状态 Schema
 */
export const OrderStatusSchema = v.pipe(
  v.enum(OrderStatus, '请选择有效的订单状态'),
  v.description('订单状态'),
);

/**
 * 订单查询参数 Schema
 */
export const OrderPageQuerySchema = v.object({
  keyword: v.optional(keyword),
  status: v.optional(OrderStatusSchema),
  userId: v.optional(v.pipe(v.string('请输入用户ID'), v.description('用户ID'))),
  ...dateRange.entries,
  ...pageQuery.entries,
});

export type OrderPageQuery = v.InferOutput<typeof OrderPageQuerySchema>;

/**
 * 创建订单 Schema
 */
export const CreateOrderSchema = v.object({
  nonce: nonce,
  productId: v.pipe(v.string('请输入用户ID'), v.description('用户ID')),
  remark: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入备注'),
        v.maxLength(500, '备注不能超过 500 个字符'),
        v.description('备注'),
      ),
    ),
  ),
});

export type CreateOrderBody = v.InferOutput<typeof CreateOrderSchema>;

/**
 * 退款订单 Schema
 */
export const RefundOrderSchema = v.object({
  reason: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入备注'),
        v.maxLength(100, '备注不能超过 100 个字符'),
        v.description('备注'),
      ),
    ),
  ),
});

export type RefundOrderBody = v.InferOutput<typeof RefundOrderSchema>;

/**
 * 更新订单快递信息 Schema
 */
export const UpdateOrderExpressSchema = v.object({
  expressCompany: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入快递公司'),
        v.trim(),
        v.maxLength(100, '快递公司不能超过 100 个字符'),
        v.description('快递公司'),
      ),
    ),
  ),
  expressNo: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入快递单号'),
        v.trim(),
        v.maxLength(100, '快递单号不能超过 100 个字符'),
        v.description('快递单号'),
      ),
    ),
  ),
});

export type UpdateOrderExpressBody = v.InferOutput<typeof UpdateOrderExpressSchema>;

/**
 * 更新订单收货信息 Schema
 */
export const UpdateOrderReceiverSchema = v.object({
  phone: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入收货电话'),
        v.trim(),
        v.maxLength(100, '收货电话不能超过 100 个字符'),
        v.description('收货电话'),
      ),
    ),
  ),
  address: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入收货地址'),
        v.trim(),
        v.maxLength(500, '收货地址不能超过 500 个字符'),
        v.description('收货地址'),
      ),
    ),
  ),
});

export type UpdateOrderReceiverBody = v.InferOutput<typeof UpdateOrderReceiverSchema>;

/**
 * 导出订单 Schema
 */
export const ExportOrdersSchema = v.object({
  ids: v.pipe(
    v.array(v.pipe(v.string('请输入订单ID'), v.uuid('请输入有效的订单ID'))),
    v.minLength(1, '请选择要导出的订单'),
    v.description('订单ID列表'),
  ),
});

export type ExportOrdersBody = v.InferOutput<typeof ExportOrdersSchema>;
