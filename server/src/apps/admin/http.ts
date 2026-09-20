import { ripple } from 'cyrenejs';

import { adminEnv } from '#apps/admin/env';
import { authUseCase, createAuthGuard, getAuthStateCookieOptions } from '#modules/auth';

/**
 * 管理端鉴权守卫。
 *
 * 做成 provider, 使路由插件可以显式声明依赖守卫,
 * 从而自带 `requiredAuth` / `requiredAdminAuth` 宏与 `auth` 上下文的类型。
 */
export const adminAuthGuard = ripple(
  {
    authUseCase,
  },
  ({ authUseCase }) =>
    createAuthGuard(
      authUseCase,
      getAuthStateCookieOptions(adminEnv.ADMIN_API_ORIGIN, adminEnv.ADMIN_WEB_ORIGINS),
    ),
  { debugName: 'AdminAuthGuard' },
);
