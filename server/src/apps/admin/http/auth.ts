import { ripple } from 'cyrenejs';

import { ApiOrigin, WebOrigins } from '#composition/tokens';
import { createAuthCookieOptions, createAuthGuard } from '#infrastructure/http';
import Auth, {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  BILI_REGISTER_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '#modules/auth';

/**
 * 管理端鉴权 Cookie 配置。
 *
 * 有效期来自 auth 模块的静态常量, 是否 Secure 由 API Origin 推导。
 */
export const AdminAuthCookies = ripple(
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
  { debugName: 'AdminAuthCookies' },
);

/**
 * 管理端鉴权守卫。
 *
 * 提供 `requiredAuth` / `requiredAdminAuth` / `requiredSuperAdminAuth` 宏
 * 以及带类型的 `auth` 上下文。
 */
export const AdminAuthGuard = ripple(
  {
    AdminAuthCookies,
    AuthUseCase: Auth.AuthUseCase,
  },
  ({ AdminAuthCookies, AuthUseCase }) => createAuthGuard(AuthUseCase, AdminAuthCookies),
  { debugName: 'AdminAuthGuard' },
);
