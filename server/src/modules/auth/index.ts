import Elysia from 'elysia';

import type { AdminRole } from '#db/schema';
import { UnauthorizedError } from '#utils';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  AUTH_COOKIE_NAME,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_OPTIONS,
  AUTH_STATE_COOKIE_VALUE,
  REFRESH_TOKEN_COOKIE_NAME,
} from './constants';
import type { AuthPayload } from './domain';
import type { AuthUseCase } from './usecase';

export * from './usecase';
export * from './constants';

function setAuth(ctx: unknown, auth: AuthPayload) {
  Object.assign(ctx as object, { auth });
}

function getAuth(ctx: unknown) {
  return (ctx as { auth: AuthPayload }).auth;
}

export const createAuthGuard = (authUseCase: AuthUseCase) => {
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

        const { payload, accessToken } = await authUseCase.refreshAccessTokenWithLock(refreshToken);

        ctx.cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
          ...ACCESS_TOKEN_COOKIE_OPTIONS,
          value: accessToken,
        });
        ctx.cookie[AUTH_STATE_COOKIE_NAME]!.set({
          ...AUTH_STATE_COOKIE_OPTIONS,
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
          auth: getAuth(ctx) as AuthPayload & { role: AdminRole },
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
          auth: getAuth(ctx) as AuthPayload & { role: 'superAdmin' },
        };
      },
    });

  return authGuard;
};
