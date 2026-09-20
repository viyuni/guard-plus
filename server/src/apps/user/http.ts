import { ripple } from 'cyrenejs';

import { userEnv } from '#apps/user/env';
import { authUseCase, createAuthGuard, getAuthStateCookieOptions } from '#modules/auth';

/**
 * 用户端鉴权守卫。
 *
 * 做成 provider, 使路由插件可以显式声明依赖守卫,
 * 从而自带 `requiredAuth` 宏与 `auth` 上下文的类型, 不再需要类型空壳插件。
 */
export const userAuthGuard = ripple(
  {
    authUseCase,
  },
  ({ authUseCase }) =>
    createAuthGuard(
      authUseCase,
      getAuthStateCookieOptions(userEnv.USER_API_ORIGIN, userEnv.USER_WEB_ORIGINS),
    ),
  { debugName: 'UserAuthGuard' },
);
