import { ripple } from 'cyrenejs';

import { ApiOrigin, WebOrigins } from '#env/config';
import { authUseCase, createAuthGuard, getAuthStateCookieOptions } from '#modules/auth';

/**
 * 用户端鉴权守卫。
 *
 * 做成 provider, 使路由插件可以显式声明依赖守卫,
 * 从而自带 `requiredAuth` 宏与 `auth` 上下文的类型, 不再需要类型空壳插件。
 */
export const userAuthGuard = ripple(
  {
    apiOrigin: ApiOrigin,
    authUseCase,
    webOrigins: WebOrigins,
  },
  ({ apiOrigin, authUseCase, webOrigins }) =>
    createAuthGuard(authUseCase, getAuthStateCookieOptions(apiOrigin, webOrigins)),
  { debugName: 'UserAuthGuard' },
);
