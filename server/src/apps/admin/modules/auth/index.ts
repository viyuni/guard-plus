import { AdminLoginSchema } from '@shared/schema/admin';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';
import { adminEnv } from '#apps/admin/env';
import {
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_VALUE,
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  getAuthStateCookieOptions,
} from '#modules/auth';

export * from './usecase';

const authStateCookieOptions = getAuthStateCookieOptions(
  adminEnv.ADMIN_API_ORIGIN,
  adminEnv.ADMIN_WEB_ORIGINS,
);

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(appContext)
  .post(
    '/login',
    async ({ body, cookie, adminAuthUseCase }) => {
      const { user, accessToken, refreshToken } = await adminAuthUseCase.login(body);

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
    async ({ cookie, authUseCase }) => {
      const accessToken = cookie[ACCESS_TOKEN_COOKIE_NAME]?.value;

      if (accessToken && typeof accessToken === 'string') {
        await authUseCase.revokeByAccessToken(accessToken);
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
