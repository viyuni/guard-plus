import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminEnv } from '#apps/admin/env';
import { createAppContext } from '#context';
import { Database } from '#context/tokens';
import { db } from '#db';
import { authUseCase } from '#modules/auth/context';
import { pointAccountUseCase } from '#modules/point/context';
import { rewardUseCase } from '#modules/reward/context';
import { userUseCase } from '#modules/user/context';
import { redis } from '#redis';

import { AdminRepository } from './modules/admin/repository';
import { AdminUseCase } from './modules/admin/usecase';
import { AdminAuthUseCase } from './modules/auth/usecase';
import { AdminUserUseCase } from './modules/user/usecase';

export const { context, container: adminContainer } = await createAppContext({
  db,
  redis,
  env: {
    ...adminEnv,
    API_ORIGIN: adminEnv.ADMIN_API_ORIGIN,
    JWT_SECRET: adminEnv.ADMIN_JWT_SECRET,
    WEB_ORIGINS: adminEnv.ADMIN_WEB_ORIGINS,
  },
});

const adminRepo = ripple({ db: Database }, ({ db }) => new AdminRepository(db), {
  debugName: 'AdminRepository',
});
const adminUseCaseProvider = ripple(
  { adminRepo },
  deps =>
    new AdminUseCase({
      ...deps,
      defaultAdmin: {
        uid: adminEnv.SUPER_ADMIN_UID,
        username: adminEnv.SUPER_ADMIN_USERNAME,
        password: adminEnv.SUPER_ADMIN_PASSWORD,
      },
    }),
  { debugName: 'AdminUseCase' },
);
const adminAuthUseCaseProvider = ripple(
  { db: Database, adminRepo, authUseCase },
  deps => new AdminAuthUseCase(deps),
  { debugName: 'AdminAuthUseCase' },
);
const adminUserUseCaseProvider = ripple(
  { db: Database, pointAccountUseCase, userUseCase, rewardUseCase },
  deps => new AdminUserUseCase(deps),
  { debugName: 'AdminUserUseCase' },
);

const { adminUseCase, adminAuthUseCase, adminUserUseCase } = await adminContainer.runtime
  .resolve(
    ripple(
      {
        adminUseCase: adminUseCaseProvider,
        adminAuthUseCase: adminAuthUseCaseProvider,
        adminUserUseCase: adminUserUseCaseProvider,
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
export const appRuntimeContext = context.decorate({
  adminAuthUseCase,
  adminUseCase,
  adminUserUseCase,
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
  return adminUseCase.initDefaultAdmin();
});
