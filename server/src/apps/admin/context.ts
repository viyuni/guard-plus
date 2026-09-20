import { ripple } from 'cyrenejs';

import { adminAppConfig, adminEnv } from '#apps/admin/env';
import { createAppContext } from '#context';
import { providersOf } from '#context/providers';
import { db } from '#db';
import { redis } from '#redis';

import { adminRoutes } from './modules/admin';
import * as adminRepository from './modules/admin/repository';
import * as adminUseCase from './modules/admin/usecase';
import { adminAuthRoutes } from './modules/auth';
import * as adminAuthUseCase from './modules/auth/usecase';
import { dashboardRoutes } from './modules/dashboard';
import { adminOrderRoutes } from './modules/order';
import { pointRoutes } from './modules/point';
import { adminProductRoutes } from './modules/product';
import { rewardRoutes } from './modules/reward';
import { adminUserRoutes } from './modules/user';
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
        adminAuthRoutes,
        adminOrderRoutes,
        adminProductRoutes,
        adminRoutes,
        adminUserRoutes,
        dashboardRoutes,
        pointRoutes,
        rewardRoutes,
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
  .use(appProviders.adminAuthRoutes)
  .use(appProviders.dashboardRoutes)
  .use(appProviders.adminRoutes)
  .use(appProviders.pointRoutes)
  .use(appProviders.rewardRoutes)
  .use(appProviders.adminProductRoutes)
  .use(appProviders.adminOrderRoutes)
  .use(appProviders.adminUserRoutes);

// 初始化默认管理员
appRuntimeContext.onStart(() => {
  return appProviders.adminUseCase.initDefaultAdmin({
    password: adminEnv.SUPER_ADMIN_PASSWORD,
    uid: adminEnv.SUPER_ADMIN_UID,
    username: adminEnv.SUPER_ADMIN_USERNAME,
  });
});
