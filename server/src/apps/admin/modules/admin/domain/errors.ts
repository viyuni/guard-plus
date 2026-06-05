import { ConflictError, ForbiddenError, NotFoundError } from '#utils';

export class AdminAlreadyExistsError extends ConflictError {
  override code = 'ADMIN_ALREADY_EXISTS';

  constructor(message = '管理员已存在') {
    super(message);
  }
}

export class AdminDisabledError extends ForbiddenError {
  override code = 'ADMIN_DISABLED';

  constructor(message = '管理员账号已被禁用') {
    super(message);
  }
}

export class AdminPermissionDeniedError extends ForbiddenError {
  override code = 'ADMIN_PERMISSION_DENIED';

  constructor(message = '普通管理员无权管理管理员') {
    super(message);
  }
}

export class AdminNotFoundError extends NotFoundError {
  override code = 'ADMIN_NOT_FOUND';

  constructor(message = '管理员不存在') {
    super(message);
  }
}

export class AdminSuperAdminCannotBeBannedError extends ForbiddenError {
  override code = 'ADMIN_SUPER_ADMIN_CANNOT_BE_BANNED';

  constructor(message = '超级管理员不能被封禁') {
    super(message);
  }
}

export const AdminErrors = {
  AdminAlreadyExistsError,
  AdminDisabledError,
  AdminNotFoundError,
  AdminPermissionDeniedError,
  AdminSuperAdminCannotBeBannedError,
};
