import { nanoid } from 'nanoid';

import type { RedisClient } from '#redis';

import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthRole, AuthSession } from '../domain';
import releaseRefreshLockScript from './release-refresh-lock.lua' with { type: 'text' };

export class AuthSessionRedisRepository {
  constructor(
    private readonly redis: RedisClient,
    private readonly ttlSeconds = REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  ) {}

  private key(role: AuthRole, sessionId: string) {
    return `auth:session:${role}:${sessionId}`;
  }

  private refreshLockKey(role: AuthRole, sessionId: string) {
    return `auth:refresh:lock:${role}:${sessionId}`;
  }

  private refreshResultKey(role: AuthRole, sessionId: string) {
    return `auth:refresh:result:${role}:${sessionId}`;
  }

  async create(accountId: string, role: AuthRole) {
    const sessionId = nanoid();
    const session: AuthSession = {
      accountId,
      role,
      sessionId,
      createdAt: new Date().toISOString(),
    };

    await this.redis.set(this.key(role, sessionId), JSON.stringify(session), {
      expiration: {
        type: 'EX',
        value: this.ttlSeconds,
      },
    });

    return session;
  }

  async find(role: AuthRole, sessionId: string) {
    const raw = await this.redis.get(this.key(role, sessionId));

    if (!raw) return null;

    return JSON.parse(raw) as AuthSession;
  }

  async exists(role: AuthRole, sessionId: string) {
    return (await this.redis.exists(this.key(role, sessionId))) > 0;
  }

  async delete(role: AuthRole, sessionId: string) {
    await this.redis.del(this.key(role, sessionId));
  }

  async acquireRefreshLock(role: AuthRole, sessionId: string, lockValue: string, ttlMs: number) {
    const result = await this.redis.set(this.refreshLockKey(role, sessionId), lockValue, {
      expiration: {
        type: 'PX',
        value: ttlMs,
      },
      condition: 'NX',
    });

    return result === 'OK';
  }

  /**
   * 仅删除当前刷新请求持有的锁。比较与删除必须保持原子性，
   * 避免已过期请求误删后续请求新建的锁。
   */
  async releaseRefreshLock(role: AuthRole, sessionId: string, lockValue: string) {
    await this.redis.eval(releaseRefreshLockScript, {
      keys: [this.refreshLockKey(role, sessionId)],
      arguments: [lockValue],
    });
  }

  async getRefreshResult(role: AuthRole, sessionId: string) {
    return this.redis.get(this.refreshResultKey(role, sessionId));
  }

  async saveRefreshResult(role: AuthRole, sessionId: string, accessToken: string, ttlSeconds = 5) {
    await this.redis.set(this.refreshResultKey(role, sessionId), accessToken, {
      expiration: {
        type: 'EX',
        value: ttlSeconds,
      },
    });
  }
}
