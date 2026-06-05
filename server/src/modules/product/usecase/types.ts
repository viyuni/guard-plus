import type { ProductStockMovementType } from '#db/schema';

export const STOCK_MOVEMENT_SOURCE_TYPE = {
  consume: 'consume',
  restore: 'restore',
  adjust: 'adminAdjustment',
} as const;

export interface ChangeStockBase<TType extends ProductStockMovementType> {
  type: TType;

  /**
   * 商品ID
   */
  productId: string;

  /**
   * 增加或减少的积分数量
   * @example -1
   * @example 1
   */
  delta: number;

  /**
   * 库存变动来源 ID
   * @example
   * 'order:999'
   * 'admin_adjustment:999'
   */
  sourceId: string;

  /**
   * 库存变动来源类型, 可以使用内建的一些值 `STOCK_MOVEMENT_SOURCE_TYPE`
   * @example
   * 'order'
   * 'admin_adjustment'
   */
  sourceType: string;

  /**
   * 幂等键
   * @example
   * 'guard_event:999:1:1777566676439'
   */
  idempotencyKey: string;

  /**
   * 库存变动备注
   */
  remark?: string;

  /**
   * 库存变动扩展信息
   */
  metadata?: Record<string, unknown>;
}

/**
 * 用户消费商品扣库存
 */
export interface ConsumeChangeStockInput extends ChangeStockBase<'consume'> {}

/**
 * 用户退款商品恢复库存
 */
export interface RefundChangeStockInput extends ChangeStockBase<'restore'> {}

/**
 * 管理员调整商品库存
 */
export interface AdjustChangeStockInput extends ChangeStockBase<'adjust'> {}

/**
 * 库存变更输入参数
 */
export type ChangeStockInput =
  | ConsumeChangeStockInput
  | RefundChangeStockInput
  | AdjustChangeStockInput;
