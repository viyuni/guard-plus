import { ripple } from 'cyrenejs';

import { ApiOrigin, WebOrigins } from '#env/config';
import { AuthUseCase, createAuthGuard, getAuthStateCookieOptions } from '#modules/auth';

/**
 * 管理端鉴权守卫。
 *
 * 做成 provider, 使路由插件可以显式声明依赖守卫,
 * 从而自带 `requiredAuth` / `requiredAdminAuth` 宏与 `auth` 上下文的类型。
 */
export const AdminAuthGuard = ripple(
  {
    ApiOrigin,
    AuthUseCase,
    WebOrigins,
  },
  ({ ApiOrigin, AuthUseCase, WebOrigins }) =>
    createAuthGuard(AuthUseCase, getAuthStateCookieOptions(ApiOrigin, WebOrigins)),
  { debugName: 'AdminAuthGuard' },
);
