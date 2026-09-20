import { ripple } from 'cyrenejs';

import { userAppConfig } from '#apps/user/env';
import { createAppContext } from '#context';
import { providersOf } from '#context/providers';
import { db } from '#db';
import { redis } from '#redis';
import { logger } from '#utils/logger';

import { authRoutes } from './modules/auth';
import * as userAuthUseCase from './modules/auth/usecase';
import * as notifyWorker from './modules/email/worker';
import { orderRoutes } from './modules/order';
import { pointAccountRoutes } from './modules/point-account';
import { pointConversionRoutes } from './modules/point-conversion';
import { pointTransactionRoutes } from './modules/point-transaction';
import { productRoutes } from './modules/product';
import { userRoutes } from './modules/user';

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
        authRoutes,
        orderRoutes,
        pointAccountRoutes,
        pointConversionRoutes,
        pointTransactionRoutes,
        productRoutes,
        userRoutes,
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
  .use(appProviders.authRoutes)
  .use(appProviders.orderRoutes)
  .use(appProviders.pointAccountRoutes)
  .use(appProviders.pointConversionRoutes)
  .use(appProviders.pointTransactionRoutes)
  .use(appProviders.productRoutes)
  .use(appProviders.userRoutes);

appRuntimeContext.onStart(() => {
  logger.info('Notify Worker started...');
});
