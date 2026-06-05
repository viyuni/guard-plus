import { AppError, BadRequestError, ConflictError, NotFoundError } from '#utils';

export class ProductNotFoundError extends NotFoundError {
  override code = 'PRODUCT_NOT_FOUND';

  constructor(message = '商品不存在') {
    super(message);
  }
}

export class ProductInvalidInputError extends BadRequestError {
  override code = 'PRODUCT_INVALID_INPUT';

  constructor(message = '商品参数不合法') {
    super(message);
  }
}

export class ProductNameExistsError extends ConflictError {
  override code = 'PRODUCT_NAME_EXISTS';

  constructor(message = '商品名称已存在') {
    super(message);
  }
}

export class StockAmountInvalidError extends BadRequestError {
  override code = 'STOCK_AMOUNT_INVALID';
  constructor(message = '库存数量错误') {
    super(message);
  }
}

export class ProductUnavailableError extends ConflictError {
  constructor(message = '商品当前不可兑换') {
    super(message);
  }
}

export class StockInsufficientError extends ConflictError {
  constructor(message = '商品库存不足') {
    super(message);
  }
}

export class StockUpdateFailedError extends ConflictError {
  constructor(message = '商品库存更新失败') {
    super(message);
  }
}

export class InvalidStockMovementDeltaError extends AppError {
  readonly status = 400;
  readonly code = 'INVALID_STOCK_MOVEMENT_DELTA';

  constructor(message = '库存流水 delta 不合法') {
    super(message);
  }
}

export class StockMovementCreateFailedError extends AppError {
  readonly status = 500;
  readonly code = 'STOCK_MOVEMENT_CREATE_FAILED';

  constructor(message = '库存流水创建失败') {
    super(message);
  }
}
