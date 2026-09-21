import Elysia from 'elysia';

import { UnauthorizedError } from '#shared';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_VALUE,
  type AuthCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from './auth-cookies';

export type AuthRole = 'user' | 'admin' | 'superAdmin';

/** 解析后的登录身份。 */
export interface AuthIdentity {
  id: string;
  role: AuthRole;
  sid: string;
}

/**
 * 鉴权守卫需要的最小用例能力。
 *
 * 用结构化接口而非直接依赖 `#modules/auth`, 使本适配器保持
 * `infrastructure → shared` 的单向依赖; 具体实现由 App 组合根注入。
 */
export interface AuthGuardUseCase {
  verifyAccessToken(token: string): Promise<AuthIdentity>;
  refreshTokenPairWithLock(token: string): Promise<{
    payload: AuthIdentity;
    accessToken: string;
    refreshToken: string;
  }>;
}

function setAuth(ctx: unknown, auth: AuthIdentity) {
  Object.assign(ctx as object, { auth });
}

function getAuth(ctx: unknown) {
  return (ctx as { auth: AuthIdentity }).auth;
}

export const createAuthGuard = (
  authUseCase: AuthGuardUseCase,
  cookieOptions: AuthCookieOptions,
) => {
  const authGuard = new Elysia({ name: 'AuthGuard' })
    .macro('requiredAuth', {
      // OpenAPI
      detail: {
        security: [{ requiredAuth: [] }],
        parameters: [
          {
            name: AUTH_COOKIE_NAME,
            in: 'cookie',
            required: false,
            description: 'JWT Cookie',
            schema: {
              type: 'string',
            },
          },
        ],
      },
      async transform(ctx) {
        const token = ctx.cookie?.[AUTH_COOKIE_NAME]?.value;
        const refreshToken = ctx.cookie?.[REFRESH_TOKEN_COOKIE_NAME]?.value;

        if (token && typeof token === 'string') {
          try {
            const payload = await authUseCase.verifyAccessToken(token);

            setAuth(ctx, {
              id: payload.id,
              role: payload.role,
              sid: payload.sid,
            });

            return;
          } catch {
            // Fall through to refresh-token based authentication.
          }
        }

        if (!refreshToken || typeof refreshToken !== 'string') {
          throw new UnauthorizedError('未登录');
        }

        const {
          payload,
          accessToken,
          refreshToken: nextRefreshToken,
        } = await authUseCase.refreshTokenPairWithLock(refreshToken);

        ctx.cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
          ...cookieOptions.accessToken,
          value: accessToken,
        });
        ctx.cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
          ...cookieOptions.refreshToken,
          value: nextRefreshToken,
        });
        ctx.cookie[AUTH_STATE_COOKIE_NAME]!.set({
          ...cookieOptions.authState,
          value: AUTH_STATE_COOKIE_VALUE,
        });

        setAuth(ctx, {
          id: payload.id,
          role: payload.role,
          sid: payload.sid,
        });
      },
      async resolve(ctx) {
        return {
          auth: getAuth(ctx),
        };
      },
    })
    .macro('requiredAdminAuth', {
      requiredAuth: true,

      async transform(ctx) {
        const auth = getAuth(ctx);

        if (auth.role !== 'admin' && auth.role !== 'superAdmin') {
          throw new UnauthorizedError();
        }
      },
      async resolve(ctx) {
        return {
          auth: getAuth(ctx) as AuthIdentity & { role: 'admin' | 'superAdmin' },
        };
      },
    })
    .macro('requiredSuperAdminAuth', {
      requiredAuth: true,

      async transform(ctx) {
        const auth = getAuth(ctx);

        if (auth.role !== 'superAdmin') {
          throw new UnauthorizedError();
        }
      },

      async resolve(ctx) {
        return {
          auth: getAuth(ctx) as AuthIdentity & { role: 'superAdmin' },
        };
      },
    });

  return authGuard;
};
