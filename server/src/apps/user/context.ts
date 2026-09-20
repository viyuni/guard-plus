import { ripple } from 'cyrenejs';

import { userAppConfig } from '#apps/user/env';
import { createAppContext } from '#context';
import { providersOf } from '#context/providers';
import { db } from '#db';
import { redis } from '#redis';
import { logger } from '#utils/logger';

import { AuthRoutes } from './modules/auth';
import * as userAuthUseCase from './modules/auth/usecase';
import * as notifyWorker from './modules/email/worker';
import { OrderRoutes } from './modules/order';
import { PointAccountRoutes } from './modules/point-account';
import { PointConversionRoutes } from './modules/point-conversion';
import { PointTransactionRoutes } from './modules/point-transaction';
import { ProductRoutes } from './modules/product';
import { UserRoutes } from './modules/user';

const { context, container } = await createAppContext({
  db,
  redis,
  config: userAppConfig,
});

/**
 * app 局部 provider：用例从命名空间派生，路由插件显式列出。
 *
 * 路由插件自身通过闭包拿到依赖，不再往 Elysia context 上挂任何业务对象。
 */
const appProviders = await container.runtime
  .resolve(
    ripple(
      {
        ...providersOf(userAuthUseCase),
        ...providersOf(notifyWorker),
        AuthRoutes,
        OrderRoutes,
        PointAccountRoutes,
        PointConversionRoutes,
        PointTransactionRoutes,
        ProductRoutes,
        UserRoutes,
      },
      deps => deps,
    ),
  )
  .catch(async error => {
    await container.runtime.dispose();
    throw error;
  });

/**
 * 真实运行时上下文。
 *
 * 只能在根 app 挂载一次。
 */
export const appRuntimeContext = context
  .use(appProviders.AuthRoutes)
  .use(appProviders.OrderRoutes)
  .use(appProviders.PointAccountRoutes)
  .use(appProviders.PointConversionRoutes)
  .use(appProviders.PointTransactionRoutes)
  .use(appProviders.ProductRoutes)
  .use(appProviders.UserRoutes);

appRuntimeContext.onStart(() => {
  logger.info('Notify Worker started...');
});
