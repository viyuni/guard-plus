import { ripple } from 'cyrenejs';

import { adminAppConfig, adminEnv } from '#apps/admin/env';
import { createAppContext } from '#context';
import { providersOf } from '#context/providers';
import { db } from '#db';
import { redis } from '#redis';

import { AdminRoutes } from './modules/admin';
import * as adminRepository from './modules/admin/repository';
import * as adminUseCase from './modules/admin/usecase';
import { AdminAuthRoutes } from './modules/auth';
import * as adminAuthUseCase from './modules/auth/usecase';
import { DashboardRoutes } from './modules/dashboard';
import { AdminOrderRoutes } from './modules/order';
import { PointRoutes } from './modules/point';
import { AdminProductRoutes } from './modules/product';
import { RewardRoutes } from './modules/reward';
import { AdminUserRoutes } from './modules/user';
import * as adminUserUseCase from './modules/user/usecase';

export const { context, container: adminContainer } = await createAppContext({
  db,
  redis,
  config: adminAppConfig,
});

/**
 * app 局部 provider：用例从命名空间派生，路由插件显式列出。
 *
 * 路由插件自身通过闭包拿到依赖，不再往 Elysia context 上挂任何业务对象。
 */
const appProviders = await adminContainer.runtime
  .resolve(
    ripple(
      {
        ...providersOf(adminRepository),
        ...providersOf(adminUseCase),
        ...providersOf(adminAuthUseCase),
        ...providersOf(adminUserUseCase),
        AdminAuthRoutes,
        AdminOrderRoutes,
        AdminProductRoutes,
        AdminRoutes,
        AdminUserRoutes,
        DashboardRoutes,
        PointRoutes,
        RewardRoutes,
      },
      deps => deps,
    ),
  )
  .catch(async error => {
    await adminContainer.runtime.dispose();
    throw error;
  });

/**
 * 真实运行时上下文。
 *
 * 只能在根 app 挂载一次。
 */
export const appRuntimeContext = context
  .use(appProviders.AdminAuthRoutes)
  .use(appProviders.DashboardRoutes)
  .use(appProviders.AdminRoutes)
  .use(appProviders.PointRoutes)
  .use(appProviders.RewardRoutes)
  .use(appProviders.AdminProductRoutes)
  .use(appProviders.AdminOrderRoutes)
  .use(appProviders.AdminUserRoutes);

// 初始化默认管理员
appRuntimeContext.onStart(() => {
  return appProviders.AdminUseCase.initDefaultAdmin({
    password: adminEnv.SUPER_ADMIN_PASSWORD,
    uid: adminEnv.SUPER_ADMIN_UID,
    username: adminEnv.SUPER_ADMIN_USERNAME,
  });
});
