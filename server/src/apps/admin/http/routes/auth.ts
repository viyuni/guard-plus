import { AdminLoginSchema } from '@shared/schema/admin';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import AdminAuthFeature from '#apps/admin/features/auth';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_VALUE,
  REFRESH_TOKEN_COOKIE_NAME,
} from '#infrastructure/http';
import Auth from '#modules/auth';

import { AdminAuthCookies } from '../auth';

export const AdminAuthRoutes = ripple(
  {
    AdminAuthCookies,
    AdminAuthUseCase: AdminAuthFeature.AdminAuthUseCase,
    AuthUseCase: Auth.AuthUseCase,
  },
  ({ AdminAuthCookies, AdminAuthUseCase, AuthUseCase }) =>
    new Elysia({
      name: 'AdminAuthRoute',
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
            ...AdminAuthCookies.accessToken,
            value: accessToken,
          });

          cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
            ...AdminAuthCookies.refreshToken,
            value: refreshToken,
          });
          cookie[AUTH_STATE_COOKIE_NAME]!.set({
            ...AdminAuthCookies.authState,
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
            ...AdminAuthCookies.authState,
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
      ),
  { debugName: 'AdminAuthRoutes' },
);
