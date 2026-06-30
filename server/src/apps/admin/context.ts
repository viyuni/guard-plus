import Elysia from 'elysia';

import { adminEnv } from '#apps/admin/env';
import { createAppContext } from '#context';
import { db } from '#db';

import { AdminRepository } from './modules/admin/repository';
import { AdminUseCase } from './modules/admin/usecase';
import { AdminAuthUseCase } from './modules/auth/usecase';

export const { context, container: adminContainer } = createAppContext({
  db,
  env: {
    ...adminEnv,
    API_ORIGIN: adminEnv.ADMIN_API_ORIGIN,
    JWT_SECRET: adminEnv.ADMIN_JWT_SECRET,
    WEB_ORIGINS: adminEnv.ADMIN_WEB_ORIGINS,
  },
});

const {
  useCases: { authUseCase },
} = adminContainer;

const adminRepo = new AdminRepository(db);

const adminUseCase = new AdminUseCase({
  adminRepo,
  defaultAdmin: {
    uid: adminEnv.SUPER_ADMIN_UID,
    username: adminEnv.SUPER_ADMIN_USERNAME,
    password: adminEnv.SUPER_ADMIN_PASSWORD,
  },
});

const adminAuthUseCase = new AdminAuthUseCase({
  db,
  adminRepo,
  authUseCase,
});

/**
 * 真实运行时上下文。
 *
 * 只能在根 app 挂载一次。
 */
export const appRuntimeContext = context.decorate({
  adminAuthUseCase,
  adminUseCase,
});

/**
 * 业务模块上下文。
 *
 * 仅用于业务模块获得 appRuntimeContext 的类型提示。
 * 运行时为空。
 *
 * 根 app 必须先 `.use(appRuntimeContext)`，再 `.use(业务模块)`。
 */
export const appContext = new Elysia({
  name: 'AdminAppContextTypeOnly',
}) as unknown as typeof appRuntimeContext;

// 初始化默认管理员
appRuntimeContext.onStart(() => {
  adminUseCase.initDefaultAdmin();
});
