import { ConflictError, NotFoundError } from '#utils';

export class OrderNotFoundError extends NotFoundError {
  override code = 'ORDER_NOT_FOUND';

  constructor(message = '订单不存在') {
    super(message);
  }
}

export class OrderStatusInvalidError extends ConflictError {
  override code = 'ORDER_STATUS_INVALID';

  constructor(message = '当前订单状态不支持该操作') {
    super(message);
  }
}

/**
 * 订单状态更新失败
 */
export class OrderUpdateFailedError extends ConflictError {
  override code = 'ORDER_UPDATE_FAILED';

  constructor(message = '订单状态更新失败') {
    super(message);
  }
}
