/**
 * 错误基类
 */
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * 请求错误
 */
export class BadRequestError extends AppError {
  status = 400;
  code = 'BAD_REQUEST';

  constructor(message = '请求错误') {
    super(message);
  }
}

/**
 * 未登录或登录已过期
 */
export class UnauthorizedError extends AppError {
  status = 401;
  code = 'UNAUTHORIZED';

  constructor(message = '未登录或登录已过期') {
    super(message);
  }
}

/**
 * 没有权限执行该操作
 */
export class ForbiddenError extends AppError {
  status = 403;
  code = 'FORBIDDEN';

  constructor(message = '没有权限执行该操作') {
    super(message);
  }
}

/**
 * 资源不存在
 */
export class NotFoundError extends AppError {
  status = 404;
  code = 'NOT_FOUND';

  constructor(message = '资源不存在') {
    super(message);
  }
}

/**
 * 资源状态冲突
 */
export class ConflictError extends AppError {
  status = 409;
  code = 'CONFLICT';

  constructor(message = '资源状态冲突') {
    super(message);
  }
}

/**
 * 服务器内部错误
 */
export class InternalServerError extends AppError {
  status = 500;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message = '服务器内部错误') {
    super(message);
  }
}

/**
 * 账号或密码错误
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = '用户名或密码错误') {
    super(message);
  }
}

export const BaseErrors = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InvalidCredentialsError,
  InternalServerError,
};
