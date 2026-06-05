import type { PointTransactionType } from '#db/schema';

/**
 * 积分流水类型
 */
export const POINT_CHANGE_SOURCE_TYPE = {
  /**
   * 订单消费
   */
  OrderConsume: 'orderConsume',

  /**
   * 订单退款
   */
  OrderRefund: 'orderRefund',

  /**
   * 管理员调整
   */
  AdminAdjustment: 'adminAdjustment',

  /**
   * 冲正流水
   */
  Reversal: 'reversal',

  /**
   * 大航海事件
   */
  GuardEvent: 'guardEvent',

  /**
   * 积分转换
   */
  Conversion: 'pointConversion',
} as const;

/**
 * 余额变更基础输入参数
 */
export interface ChangeBalanceBase<TType extends PointTransactionType> {
  /**
   * 积分流水类型
   */
  type: TType;

  /**
   * 用户ID
   */
  userId: string;

  /**
   * 积分类型ID
   * @example
   */
  pointTypeId: string;

  /**
   * 增加或减少的积分数量
   * @example -1
   * @example 1
   */
  delta: number;

  /**
   * 积分流水来源类型
   * 可以使用内建的一些值 `POINT_CHANGE_SOURCE_TYPE`
   * @example 'order_consume'
   */
  sourceType: string;

  /**
   * 积分流水来源ID
   * @example 'order:999'
   */
  sourceId: string;

  /**
   * 幂等键
   * @example 'guard_event:999:1:1777566676439'
   */
  idempotencyKey: string;

  /**
   * 积分流水备注
   */
  remark?: string;

  /**
   * 积分流水扩展信息
   */
  metadata?: Record<string, unknown>;
}

/**
 * 余额变更, 发放
 */
export interface GrantChangeBalanceInput extends ChangeBalanceBase<'grant'> {}

/**
 * 余额变更, 消费
 */
export interface ConsumeChangeBalanceInput extends ChangeBalanceBase<'consume'> {}

/**
 * 余额变更, 退款
 */
export interface RefundChangeBalanceInput extends ChangeBalanceBase<'refund'> {}

/**
 * 余额变更, 管理员调整
 */
export interface AdjustChangeBalanceInput extends ChangeBalanceBase<'adjust'> {}

/**
 * 余额变更, 冲正流水
 */
export interface ReversalChangeBalanceInput extends ChangeBalanceBase<'reversal'> {
  reversalOfTransactionId: string;
}

/**
 * 余额变更输入参数
 */
export type ChangeBalanceInput =
  | GrantChangeBalanceInput
  | ConsumeChangeBalanceInput
  | RefundChangeBalanceInput
  | AdjustChangeBalanceInput
  | ReversalChangeBalanceInput;
