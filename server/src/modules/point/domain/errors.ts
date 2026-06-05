import {
  AppError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '#utils';

/**
 * 积分类型不存在
 */
export class PointTypeNotFoundError extends NotFoundError {
  override code = 'POINT_TYPE_NOT_FOUND';

  constructor(message = '积分类型不存在') {
    super(message);
  }
}

/**
 * 积分类型名称已存在
 */
export class PointTypeNameExistsError extends ConflictError {
  override code = 'POINT_TYPE_NAME_EXISTS';

  constructor(message = '积分类型名称已存在') {
    super(message);
  }
}

/**
 * 积分类型不可用
 */
export class PointTypeUnavailableError extends BadRequestError {
  override code = 'POINT_TYPE_UNAVAILABLE';

  constructor(message = '积分类型不存在或不可用') {
    super(message);
  }
}

/**
 * 积分账户不存在
 */
export class PointAccountNotFoundError extends NotFoundError {
  override code = 'POINT_ACCOUNT_NOT_FOUND';

  constructor(message = '积分账户不存在') {
    super(message);
  }
}

/**
 * 积分余额不足
 */
export class PointBalanceInsufficientError extends ConflictError {
  override code = 'POINT_BALANCE_INSUFFICIENT';

  constructor(message = '积分余额不足') {
    super(message);
  }
}

/**
 * 确保积分账户失败
 */
export class PointAccountEnsureFailedError extends InternalServerError {
  override code = 'POINT_ACCOUNT_ENSURE_FAILED';

  constructor(message = '积分账户创建失败') {
    super(message);
  }
}

/**
 * 积分数量错误
 */
export class PointAmountInvalidError extends BadRequestError {
  override code = 'POINT_AMOUNT_INVALID';

  constructor(message = '积分数量错误') {
    super(message);
  }
}

/**
 * 积分账户更新失败
 */
export class PointAccountUpdateFailedError extends InternalServerError {
  override code = 'POINT_ACCOUNT_UPDATE_FAILED';

  constructor(message = '积分账户更新失败') {
    super(message);
  }
}

/**
 * 积分流水不存在
 */
export class PointTransactionNotFoundError extends NotFoundError {
  override code = 'POINT_TRANSACTION_NOT_FOUND';

  constructor(message = '积分流水不存在') {
    super(message);
  }
}

/**
 * 积分账户已暂停
 */
export class PointAccountSuspendedError extends AppError {
  readonly status = 403;
  readonly code = 'POINT_ACCOUNT_SUSPENDED';

  constructor() {
    super('积分账户已暂停，无法消费积分');
  }
}

/**
 * 积分账户已禁用
 */
export class PointAccountBannedError extends AppError {
  readonly status = 403;
  readonly code = 'POINT_ACCOUNT_BANNED';

  constructor() {
    super('积分账户已封禁，无法变更积分');
  }
}

/**
 * 积分流水创建失败
 */
export class PointTransactionCreateFailedError extends AppError {
  readonly status = 500;
  readonly code = 'POINT_TRANSACTION_CREATE_FAILED';

  constructor() {
    super('积分流水创建失败');
  }
}

/**
 * 积分流水 delta 不合法
 */
export class InvalidPointTransactionDeltaError extends AppError {
  readonly status = 400;
  readonly code = 'INVALID_POINT_TRANSACTION_DELTA';

  constructor(message = '积分流水 delta 不合法') {
    super(message);
  }
}

/**
 * 积分流水已冲正
 */
export class PointTransactionAlreadyReversedError extends AppError {
  readonly status = 400;
  readonly code = 'POINT_TRANSACTION_ALREADY_REVERSED';

  constructor(message = '积分流水已被冲正') {
    super(message);
  }
}

export class PointAccountMismatchError extends BadRequestError {
  override code = 'POINT_ACCOUNT_MISMATCH';

  constructor(message = '积分账户与余额变更参数不匹配') {
    super(message);
  }
}

export class PointTransactionIdempotencyConflictError extends ConflictError {
  override code = 'POINT_TRANSACTION_IDEMPOTENCY_CONFLICT';

  constructor(message = '积分流水幂等键已被其他请求使用') {
    super(message);
  }
}

export class PointConversionRuleNotFoundError extends NotFoundError {
  override code = 'POINT_CONVERSION_RULE_NOT_FOUND';

  constructor(message = '积分转换规则不存在') {
    super(message);
  }
}

export class PointConversionRuleNameExistsError extends ConflictError {
  override code = 'POINT_CONVERSION_RULE_NAME_EXISTS';

  constructor(message = '积分转换规则名称已存在') {
    super(message);
  }
}

export class PointConversionRulePairExistsError extends ConflictError {
  override code = 'POINT_CONVERSION_RULE_PAIR_EXISTS';

  constructor(message = '相同来源和目标积分类型的转换规则已存在') {
    super(message);
  }
}

export class PointConversionRuleInvalidError extends BadRequestError {
  override code = 'POINT_CONVERSION_RULE_INVALID';

  constructor(message = '积分转换规则不合法') {
    super(message);
  }
}

export class PointConversionRuleUnavailableError extends BadRequestError {
  override code = 'POINT_CONVERSION_RULE_UNAVAILABLE';

  constructor(message = '积分转换规则不可用') {
    super(message);
  }
}
