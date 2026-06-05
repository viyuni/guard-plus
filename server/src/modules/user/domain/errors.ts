import { AppError, ConflictError, NotFoundError } from '#utils';

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('用户不存在');
  }
}

/**
 * 用户不可用
 */
export class UserUnavailableError extends AppError {
  status = 400;
  code = 'USER_UNAVAILABLE';

  constructor(message = '用户不可用') {
    super(message);
  }
}

/**
 * 用户已注册
 */
export class UserAlreadyRegisteredError extends ConflictError {
  constructor(message = '用户已注册') {
    super(message);
  }
}
