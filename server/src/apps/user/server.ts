import { elysiaCyrene } from '@cyrenex/elysia';
import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { Auth } from '#apps/user/auth';
import { ImageSavePath, imageSavePath } from '#config';
import { createErrorHandler, health, openapi } from '#infrastructure/http';
import { Logger } from '#infrastructure/logger';
import { createImageAssets } from '#infrastructure/storage';
import BiliEvent from '#modules/bili-event';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';
import { version } from '~/package.json' with { type: 'json' };

import { userConfig, WebOrigins } from './config';
import UserAuthFeature from './features/auth';
import UserEmailFeature from './features/email';
import { UserAuthCookies, UserAuthGuard } from './http/auth';
import { UserHttp } from './http/root';
import { AuthRoutes } from './http/routes/auth';
import { OrderRoutes } from './http/routes/order';
import { PointAccountRoutes } from './http/routes/point-account';
import { PointConversionRoutes } from './http/routes/point-conversion';
import { PointTransactionRoutes } from './http/routes/point-transaction';
import { ProductRoutes } from './http/routes/product';
import { UserRoutes } from './http/routes/user';

const UserAppRipples = {
  ...Auth,
  ...BiliEvent,
  ...Order,
  ...Point,
  ...Product,
  ...Reward,
  ...User,

  ...UserAuthFeature,
  ...UserEmailFeature,

  UserAuthCookies,
  UserAuthGuard,

  AuthRoutes,
  OrderRoutes,
  PointAccountRoutes,
  PointConversionRoutes,
  PointTransactionRoutes,
  ProductRoutes,
  UserRoutes,

  UserHttp,
};

// Elysia 插件持有容器: HTTP 停止时由它关闭依赖图。
const container = elysiaCyrene();

const runtime = container.decorator.cyrene.use(
  ...Object.values(UserAppRipples),
  Logger,
  ImageSavePath,
  WebOrigins,
);

/** 预热应用容器并装配 User HTTP 服务。 */
export async function createUserServer() {
  const config = userConfig;

  try {
    // 启动期预热: 校验完整依赖图并初始化所有可达 singleton。
    await runtime.init();

    const ripples = runtime.ripples;

    const logger = ripples.Logger;

    const app = new Elysia({
      serve: {
        port: config.port,
        reusePort: true,
      },
    })
      .use(
        cors({
          origin: ripples.WebOrigins,
          allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          credentials: true,
        }),
      )
      // cyrene 插件必须先安装: 它提供容器并负责停止时释放依赖图。
      .use(container)
      .use(ripples.UserHttp)
      .use(createErrorHandler(logger))
      .use(createImageAssets({ assets: imageSavePath }))
      .use(health)
      .get('/', () => 'Viyuni Guard plus server running... :)');

    if (config.nodeEnv === 'development') {
      app.use(
        openapi({
          title: 'Viyuni Guard Plus',
          version,
        }),
      );
    }

    return {
      app,
      config,
      logger,
    };
  } catch (error) {
    await runtime.dispose();

    throw error;
  }
}

export type UserApp = Awaited<ReturnType<typeof createUserServer>>['app'];
