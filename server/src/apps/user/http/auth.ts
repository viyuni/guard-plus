import { ripple } from 'cyrenex';

import { Auth } from '#apps/user/auth';
import { createAuthCookieOptions, createAuthGuard } from '#infrastructure/http';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  BILI_REGISTER_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '#modules/auth';

import { ApiOrigin, WebOrigins } from '../config';

/**
 * 用户端鉴权 Cookie 配置。
 *
 * 有效期来自 auth 模块的静态常量, 是否 Secure 由 API Origin 推导。
 */
export const UserAuthCookies = ripple(
  'UserAuthCookies',
  {
    ApiOrigin,
    WebOrigins,
  },
  ({ ApiOrigin, WebOrigins }) =>
    createAuthCookieOptions({
      apiOrigin: ApiOrigin,
      webOrigins: WebOrigins,
      durations: {
        accessTokenSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
        refreshTokenSeconds: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
        biliRegisterSeconds: BILI_REGISTER_EXPIRES_IN_SECONDS,
      },
    }),
);

/**
 * 用户端鉴权守卫。
 *
 * 提供 `requiredAuth` 宏以及带类型的 `auth` 上下文。
 */
export const UserAuthGuard = ripple(
  'UserAuthGuard',
  {
    AuthUseCase: Auth.AuthUseCase,
    UserAuthCookies,
  },
  ({ AuthUseCase, UserAuthCookies }) => createAuthGuard(AuthUseCase, UserAuthCookies),
);
