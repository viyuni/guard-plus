import { afterEach, describe, expect, it, mock, setSystemTime, spyOn } from 'bun:test';

import { Cyrene } from 'cyrenejs';
import Elysia from 'elysia';
import { decodeJwt } from 'jose';

import { Redis } from '#context/tokens';
import { JwtSecret } from '#env/config';
import type { RedisClient } from '#redis';

import type { AuthTokenPair } from '../domain';
import { createAuthGuard, getAuthStateCookieOptions } from '../index';
import { AuthSessionRepo } from '../repository';
import { AuthUseCase } from '../usecase';

afterEach(() => {
  setSystemTime();
});

function getSetCookieValue(response: Response, name: string) {
  const prefix = `${name}=`;
  const cookie = response.headers.getSetCookie().find(value => value.startsWith(prefix));

  if (!cookie) {
    throw new Error(`缺少 ${name} Set-Cookie`);
  }

  return cookie.slice(prefix.length).split(';', 1)[0]!;
}

const runtimes: Array<{ dispose: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(runtimes.splice(0).map(runtime => runtime.dispose()));
});

/**
 * 用真实 provider 装配, 再把会话仓库替换为内存实现,
 * 既覆盖 JWT 逻辑, 又验证依赖图正确接上。
 */
async function createAuthUseCase() {
  const sessions = new Map<string, { accountId: string; role: 'user' | 'admin' | 'superAdmin' }>();
  const refreshResults = new Map<string, AuthTokenPair>();
  const refreshLocks = new Set<string>();

  const runtime = new Cyrene({
    providers: { AuthSessionRepo, AuthUseCase },
    bindings: [
      // 会话仓库的方法会被下面整体替换, 这里只需要一个占位客户端。
      { token: Redis, value: {} as RedisClient },
      { token: JwtSecret, value: 'test-secret' },
    ],
  });

  runtimes.push(runtime);

  const container = await runtime.start();
  const repo = container.AuthSessionRepo;

  spyOn(repo, 'create').mockImplementation(
    async (accountId: string, role: 'user' | 'admin' | 'superAdmin') => {
      const sessionId = `${role}-${accountId}-session`;
      sessions.set(`${role}:${sessionId}`, { accountId, role });

      return {
        accountId,
        role,
        sessionId,
        createdAt: new Date().toISOString(),
      };
    },
  );

  spyOn(repo, 'find').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      const session = sessions.get(`${role}:${sessionId}`);

      if (!session) {
        return null;
      }

      return {
        ...session,
        sessionId,
        createdAt: new Date().toISOString(),
      };
    },
  );

  spyOn(repo, 'delete').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      sessions.delete(`${role}:${sessionId}`);
    },
  );

  spyOn(repo, 'extend').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      return sessions.has(`${role}:${sessionId}`) ? 1 : 0;
    },
  );

  spyOn(repo, 'getRefreshResult').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      return refreshResults.get(`${role}:${sessionId}`) ?? null;
    },
  );

  spyOn(repo, 'saveRefreshResult').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string, tokens: AuthTokenPair) => {
      refreshResults.set(`${role}:${sessionId}`, tokens);
    },
  );

  spyOn(repo, 'acquireRefreshLock').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      const key = `${role}:${sessionId}`;

      if (refreshLocks.has(key)) {
        return false;
      }

      refreshLocks.add(key);
      return true;
    },
  );

  spyOn(repo, 'releaseRefreshLock').mockImplementation(
    async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      refreshLocks.delete(`${role}:${sessionId}`);
    },
  );

  return {
    authUseCase: container.AuthUseCase,
    authSessionRepo: repo,
  };
}

describe('AuthUseCase', () => {
  it('签发和解析对象 JWT payload', async () => {
    const { authUseCase } = await createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'admin-id',
      role: 'superAdmin',
    });

    const payload = await authUseCase.verifyAccessToken(accessToken);

    expect(payload).toEqual({
      id: 'admin-id',
      role: 'superAdmin',
      sid: 'superAdmin-admin-id-session',
    });
  });

  it('解析没有 role 的 user token', async () => {
    const { authUseCase } = await createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
    });

    const payload = await authUseCase.verifyAccessToken(accessToken);

    expect(payload).toEqual({
      id: 'user-id',
      role: 'user',
      sid: 'user-user-id-session',
    });
  });

  it('使用 refreshToken 刷新 TokenPair 并延长会话', async () => {
    const { authUseCase, authSessionRepo } = await createAuthUseCase();

    const { refreshToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    const tokens = await authUseCase.refreshTokenPair(refreshToken);
    const { accessToken } = tokens;
    const payload = await authUseCase.verifyAccessToken(accessToken);
    const refreshPayload = await authUseCase.verifyRefreshToken(tokens.refreshToken);

    expect(payload).toEqual({
      id: 'user-id',
      role: 'user',
      sid: 'user-user-id-session',
    });
    expect(refreshPayload).toEqual(payload);
    expect(authSessionRepo.extend).toHaveBeenCalledWith('user', 'user-user-id-session');
  });

  it('拒绝把 accessToken 当 refreshToken 使用', async () => {
    const { authUseCase } = await createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    expect(authUseCase.refreshTokenPair(accessToken)).rejects.toThrow();
  });

  it('并发刷新时复用 Redis 锁内生成的 TokenPair', async () => {
    const { authUseCase, authSessionRepo } = await createAuthUseCase();

    const { refreshToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    const [first, second] = await Promise.all([
      authUseCase.refreshTokenPairWithLock(refreshToken),
      authUseCase.refreshTokenPairWithLock(refreshToken),
    ]);

    expect(first.accessToken).toBe(second.accessToken);
    expect(first.refreshToken).toBe(second.refreshToken);
    expect(authSessionRepo.extend).toHaveBeenCalledTimes(1);
    expect(authSessionRepo.saveRefreshResult).toHaveBeenCalledTimes(1);
  });
});

describe('getAuthStateCookieOptions', () => {
  it('选择与 API 匹配的最具体 Web 父域', () => {
    const options = getAuthStateCookieOptions('https://api.admin.example.com', [
      'https://example.com',
      'https://admin.example.com',
    ]);

    expect(options.domain).toBe('admin.example.com');
  });

  it('拒绝不属于任一 Web Origin 的 API Origin', () => {
    expect(() =>
      getAuthStateCookieOptions('https://api.example.net', ['https://example.com']),
    ).toThrow();
  });
});

describe('requiredSuperAdminAuth', () => {
  function createApp(payload: { id: string; role?: string; sid: string }) {
    const authUseCase = {
      verifyAccessToken: mock(async () => payload),
    } as any;

    const app = new Elysia().use(createAuthGuard(authUseCase)).get(
      '/super',
      ({ auth: { id, role } }) => ({
        id,
        role,
      }),
      {
        requiredSuperAdminAuth: true,
      },
    );

    return { app, authUseCase };
  }

  it('允许超级管理员访问', async () => {
    const { app, authUseCase } = createApp({
      id: 'admin-id',
      role: 'superAdmin',
      sid: 'session-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'accessToken=token',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'admin-id',
      role: 'superAdmin',
    });
    expect(authUseCase.verifyAccessToken).toHaveBeenCalledWith('token');
  });

  it('拒绝普通管理员访问', async () => {
    const { app } = createApp({
      id: 'admin-id',
      role: 'admin',
      sid: 'session-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'accessToken=token',
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('未登录或登录已过期');
  });

  it('拒绝没有角色的 user token', async () => {
    const { app } = createApp({
      id: 'user-id',
      sid: 'session-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'accessToken=token',
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it('缺少 token 时拒绝访问', async () => {
    const { app } = createApp({
      id: 'admin-id',
      role: 'superAdmin',
      sid: 'session-id',
    });

    const response = await app.handle(new Request('http://localhost/super'));

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('未登录');
  });
});

describe('requiredAuth token refresh', () => {
  it('AccessToken 过期后真实刷新双 Token 和前端登录状态 Cookie', async () => {
    const loginAt = new Date('2026-01-01T00:00:00.000Z');
    setSystemTime(loginAt);

    const { authUseCase, authSessionRepo } = await createAuthUseCase();

    const originalTokens = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    setSystemTime(loginAt.getTime() + 16 * 60 * 1000);

    const app = new Elysia()
      .use(createAuthGuard(authUseCase))
      .get('/me', ({ auth }) => auth, { requiredAuth: true });

    const response = await app.handle(
      new Request('http://localhost/me', {
        headers: {
          cookie: `accessToken=${originalTokens.accessToken}; refreshToken=${originalTokens.refreshToken}`,
        },
      }),
    );

    const nextAccessToken = getSetCookieValue(response, 'accessToken');
    const nextRefreshToken = getSetCookieValue(response, 'refreshToken');
    const authState = getSetCookieValue(response, 'auth');

    expect(response.status).toBe(200);
    expect(nextAccessToken).not.toBe(originalTokens.accessToken);
    expect(nextRefreshToken).not.toBe(originalTokens.refreshToken);
    expect(authState).toBe('1');
    expect(decodeJwt(nextAccessToken).exp).toBeGreaterThan(
      decodeJwt(originalTokens.accessToken).exp!,
    );
    expect(decodeJwt(nextRefreshToken).exp).toBeGreaterThan(
      decodeJwt(originalTokens.refreshToken).exp!,
    );
    expect(await authUseCase.verifyAccessToken(nextAccessToken)).toMatchObject({ id: 'user-id' });
    expect(await authUseCase.verifyRefreshToken(nextRefreshToken)).toMatchObject({ id: 'user-id' });
    expect(authSessionRepo.extend).toHaveBeenCalledWith('user', 'user-user-id-session');
  });
});
