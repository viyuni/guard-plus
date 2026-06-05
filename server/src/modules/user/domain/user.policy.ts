import type { User } from '#db/schema';

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

export class UserPolicy {
  static isAvailable<T extends UserStatusLike>(
    user: T | null | undefined,
  ): user is AvailableUserStatus<T> {
    return !!user && user.status !== 'banned';
  }

  // 确保账户未封禁
  static assertAvailable<T extends UserStatusLike>(
    user: T | null | undefined,
  ): asserts user is AvailableUserStatus<T> {
    if (!UserPolicy.isAvailable(user)) {
      throw new UserUnavailableError();
    }
  }

  static assertAvailableExists<T extends UserStatusLike>(
    user: T | null | undefined,
  ): asserts user is AvailableUserStatus<T> {
    UserPolicy.assertExists(user);
    UserPolicy.assertAvailable(user);
  }

  /**
   * 确保账户存在
   */
  static assertExists<T>(user: T | null | undefined): asserts user is T {
    if (!user) {
      throw new UserNotFoundError();
    }
  }
}
