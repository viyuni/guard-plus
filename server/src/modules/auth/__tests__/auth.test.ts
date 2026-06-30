import { describe, expect, it, mock } from 'bun:test';

import Elysia from 'elysia';

import { createAuthGuard, getAuthStateCookieOptions } from '../index';
import { AuthUseCase } from '../usecase';

function createAuthUseCase() {
  const sessions = new Map<string, { accountId: string; role: 'user' | 'admin' | 'superAdmin' }>();
  const refreshResults = new Map<string, string>();
  const refreshLocks = new Set<string>();
  const authSessionRepo = {
    create: mock(async (accountId: string, role: 'user' | 'admin' | 'superAdmin') => {
      const sessionId = `${role}-${accountId}-session`;
      sessions.set(`${role}:${sessionId}`, { accountId, role });

      return {
        accountId,
        role,
        sessionId,
        createdAt: new Date().toISOString(),
      };
    }),
    find: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      const session = sessions.get(`${role}:${sessionId}`);

      if (!session) return null;

      return {
        ...session,
        sessionId,
        createdAt: new Date().toISOString(),
      };
    }),
    delete: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      sessions.delete(`${role}:${sessionId}`);
    }),
    getRefreshResult: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      return refreshResults.get(`${role}:${sessionId}`) ?? null;
    }),
    saveRefreshResult: mock(
      async (role: 'user' | 'admin' | 'superAdmin', sessionId: string, accessToken: string) => {
        refreshResults.set(`${role}:${sessionId}`, accessToken);
      },
    ),
    acquireRefreshLock: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      const key = `${role}:${sessionId}`;

      if (refreshLocks.has(key)) {
        return false;
      }

      refreshLocks.add(key);
      return true;
    }),
    releaseRefreshLock: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      refreshLocks.delete(`${role}:${sessionId}`);
    }),
  } as any;

  return {
    authUseCase: new AuthUseCase('test-secret', authSessionRepo),
    authSessionRepo,
  };
}

describe('AuthUseCase', () => {
  it('签发和解析对象 JWT payload', async () => {
    const { authUseCase } = createAuthUseCase();

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
    const { authUseCase } = createAuthUseCase();

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

  it('使用 refreshToken 刷新 AccessToken', async () => {
    const { authUseCase } = createAuthUseCase();

    const { refreshToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });
    const accessToken = await authUseCase.refreshAccessToken(refreshToken);
    const payload = await authUseCase.verifyAccessToken(accessToken);

    expect(payload).toEqual({
      id: 'user-id',
      role: 'user',
      sid: 'user-user-id-session',
    });
  });

  it('拒绝把 accessToken 当 refreshToken 使用', async () => {
    const { authUseCase } = createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    expect(authUseCase.refreshAccessToken(accessToken)).rejects.toThrow();
  });

  it('并发刷新时复用 Redis 锁内生成的 AccessToken', async () => {
    const { authUseCase, authSessionRepo } = createAuthUseCase();

    const { refreshToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    const [first, second] = await Promise.all([
      authUseCase.refreshAccessTokenWithLock(refreshToken),
      authUseCase.refreshAccessTokenWithLock(refreshToken),
    ]);

    expect(first.accessToken).toBe(second.accessToken);
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
