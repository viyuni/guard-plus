import { describe, expect, it } from 'bun:test';

import type { User } from '#infrastructure/db/schema';

import { UserUnavailableError } from '../domain';
import { assertUserAvailable, isUserAvailable } from '../domain';

function user(input: Partial<User> = {}): User {
  return {
    id: crypto.randomUUID(),
    biliUid: `policy_user_${crypto.randomUUID()}`,
    username: `policy_user_${crypto.randomUUID()}`,
    status: 'active',
    passwordHash: 'hashed-password',
    phoneEncrypted: null,
    emailEncrypted: null,
    phoneHash: null,
    addressEncrypted: null,
    remark: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };
}

describe('用户策略', () => {
  it('允许 normal 用户', () => {
    expect(isUserAvailable(user({ status: 'active' }))).toBe(true);
    expect(() => assertUserAvailable(user({ status: 'active' }))).not.toThrow();
  });

  it('拒绝不存在的用户', () => {
    expect(isUserAvailable(null)).toBe(false);
    expect(() => assertUserAvailable(null)).toThrow(UserUnavailableError);
  });

  it('拒绝 banned 用户', () => {
    expect(isUserAvailable(user({ status: 'banned' }))).toBe(false);
    expect(() => assertUserAvailable(user({ status: 'banned' }))).toThrow(UserUnavailableError);
  });
});
