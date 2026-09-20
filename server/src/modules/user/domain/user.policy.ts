import type { User } from '#db/schema';
import { assertPresent } from '#utils';

import { UserNotFoundError, UserUnavailableError } from './errors';

type UserStatusLike = {
  status: User['status'];
};

export type AvailableUser = User & {
  status: Exclude<User['status'], 'banned'>;
};

type AvailableUserStatus<T extends UserStatusLike> = T & {
  status: Exclude<T['status'], 'banned'>;
};

/**
 * 用户是否可用（未封禁）。
 *
 * 泛型保留入参的精确类型，使带关联查询的行在断言后不丢失额外字段。
 */
export function isUserAvailable<T extends UserStatusLike>(
  user: T | null | undefined,
): user is AvailableUserStatus<T> {
  if (!user) {
    return false;
  }

  return user.status !== 'banned';
}

// 确保账户未封禁
export function assertUserAvailable<T extends UserStatusLike>(
  user: T | null | undefined,
): asserts user is AvailableUserStatus<T> {
  if (!isUserAvailable(user)) {
    throw new UserUnavailableError();
  }
}

/**
 * 确保账户存在
 */
export function assertUserExists<T>(user: T | null | undefined): asserts user is T {
  assertPresent(user, () => new UserNotFoundError());
}

export function assertUserAvailableExists<T extends UserStatusLike>(
  user: T | null | undefined,
): asserts user is AvailableUserStatus<T> {
  assertUserExists(user);
  assertUserAvailable(user);
}
