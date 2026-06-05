import { describe, expect, it } from 'bun:test';

import type { User } from '#db/schema';

import { UserUnavailableError } from '../domain';
import { UserPolicy } from '../domain';

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
    expect(UserPolicy.isAvailable(user({ status: 'active' }))).toBe(true);
    expect(() => UserPolicy.assertAvailable(user({ status: 'active' }))).not.toThrow();
  });

  it('拒绝不存在的用户', () => {
    expect(UserPolicy.isAvailable(null)).toBe(false);
    expect(() => UserPolicy.assertAvailable(null)).toThrow(UserUnavailableError);
  });

  it('拒绝 banned 用户', () => {
    expect(UserPolicy.isAvailable(user({ status: 'banned' }))).toBe(false);
    expect(() => UserPolicy.assertAvailable(user({ status: 'banned' }))).toThrow(
      UserUnavailableError,
    );
  });
});
