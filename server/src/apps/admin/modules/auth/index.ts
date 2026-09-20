import { AdminLoginSchema } from '@shared/schema/admin';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { ApiOrigin, WebOrigins } from '#env/config';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_VALUE,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  AuthUseCase,
  getAuthStateCookieOptions,
} from '#modules/auth';

import { AdminAuthUseCase } from './usecase';

export * from './usecase';

export const AdminAuthRoutes = ripple(
  {
    AdminAuthUseCase,
    ApiOrigin,
    AuthUseCase,
    WebOrigins,
  },
  ({ AdminAuthUseCase, ApiOrigin, AuthUseCase, WebOrigins }) => {
    const authStateCookieOptions = getAuthStateCookieOptions(ApiOrigin, WebOrigins);

    return new Elysia({
      name: 'AuthRoute',
      prefix: '/auth',
      detail: {
        tags: ['Auth'],
      },
    })
      .post(
        '/login',
        async ({ body, cookie }) => {
          const { user, accessToken, refreshToken } = await AdminAuthUseCase.login(body);

          cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
            ...ACCESS_TOKEN_COOKIE_OPTIONS,
            value: accessToken,
          });

          cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
            ...REFRESH_TOKEN_COOKIE_OPTIONS,
            value: refreshToken,
          });
          cookie[AUTH_STATE_COOKIE_NAME]!.set({
            ...authStateCookieOptions,
            value: AUTH_STATE_COOKIE_VALUE,
          });

          return user;
        },
        {
          body: AdminLoginSchema,
          detail: {
            description: '管理员登录',
          },
        },
      )
      .post(
        '/logout',
        async ({ cookie }) => {
          const accessToken = cookie[ACCESS_TOKEN_COOKIE_NAME]?.value;

          if (accessToken && typeof accessToken === 'string') {
            await AuthUseCase.revokeByAccessToken(accessToken);
          }

          cookie[ACCESS_TOKEN_COOKIE_NAME]!.remove();
          cookie[REFRESH_TOKEN_COOKIE_NAME]!.remove();
          cookie[AUTH_STATE_COOKIE_NAME]!.set({
            ...authStateCookieOptions,
            maxAge: 0,
            value: '',
          });

          return {
            success: true,
          };
        },
        {
          detail: {
            description: '管理员退出登录',
          },
        },
      );
  },
);
