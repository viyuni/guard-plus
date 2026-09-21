import { type InferInput, ripple } from 'cyrenejs';
import { nanoid } from 'nanoid';

import { Redis } from '#composition/tokens';

import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthRole, AuthSession, AuthTokenPair } from '../domain';
import releaseRefreshLockScript from './release-refresh-lock.lua' with { type: 'text' };

export const AuthSessionRepo = ripple(
  {
    Redis,
  },
  ({ Redis }) => {
    const ttlSeconds = REFRESH_TOKEN_EXPIRES_IN_SECONDS;

    function key(role: AuthRole, sessionId: string) {
      return `auth:session:${role}:${sessionId}`;
    }

    function refreshLockKey(role: AuthRole, sessionId: string) {
      return `auth:refresh:lock:${role}:${sessionId}`;
    }

    function refreshResultKey(role: AuthRole, sessionId: string) {
      return `auth:refresh:result:${role}:${sessionId}`;
    }

    return {
      async create(accountId: string, role: AuthRole) {
        const sessionId = nanoid();

        const session: AuthSession = {
          accountId,
          role,
          sessionId,
          createdAt: new Date().toISOString(),
        };

        await Redis.set(key(role, sessionId), JSON.stringify(session), {
          expiration: {
            type: 'EX',
            value: ttlSeconds,
          },
        });

        return session;
      },

      async find(role: AuthRole, sessionId: string) {
        const raw = await Redis.get(key(role, sessionId));

        if (!raw) {
          return null;
        }

        return JSON.parse(raw) as AuthSession;
      },

      async exists(role: AuthRole, sessionId: string) {
        return (await Redis.exists(key(role, sessionId))) > 0;
      },

      async delete(role: AuthRole, sessionId: string) {
        await Redis.del(key(role, sessionId));
      },

      async extend(role: AuthRole, sessionId: string) {
        return Redis.expire(key(role, sessionId), ttlSeconds);
      },

      async acquireRefreshLock(
        role: AuthRole,
        sessionId: string,
        lockValue: string,
        ttlMs: number,
      ) {
        const result = await Redis.set(refreshLockKey(role, sessionId), lockValue, {
          expiration: {
            type: 'PX',
            value: ttlMs,
          },
          condition: 'NX',
        });

        return result === 'OK';
      },

      /**
       * 仅删除当前刷新请求持有的锁。比较与删除必须保持原子性，
       * 避免已过期请求误删后续请求新建的锁。
       */
      async releaseRefreshLock(role: AuthRole, sessionId: string, lockValue: string) {
        await Redis.eval(releaseRefreshLockScript, {
          keys: [refreshLockKey(role, sessionId)],
          arguments: [lockValue],
        });
      },

      async getRefreshResult(role: AuthRole, sessionId: string) {
        const raw = await Redis.get(refreshResultKey(role, sessionId));

        if (!raw) {
          return null;
        }

        try {
          return JSON.parse(raw) as AuthTokenPair;
        } catch {
          return null;
        }
      },

      async saveRefreshResult(
        role: AuthRole,
        sessionId: string,
        tokens: AuthTokenPair,
        resultTtlSeconds = 5,
      ) {
        await Redis.set(refreshResultKey(role, sessionId), JSON.stringify(tokens), {
          expiration: {
            type: 'EX',
            value: resultTtlSeconds,
          },
        });
      },
    };
  },
  { debugName: 'AuthSessionRepository' },
);

export type AuthSessionRedisRepository = InferInput<typeof AuthSessionRepo>;
