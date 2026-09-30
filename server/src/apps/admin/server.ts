import { elysiaCyrene } from '@cyrenex/elysia';
import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { Auth } from '#apps/admin/auth';
import { ImageSavePath, imageSavePath } from '#config';
import { createErrorHandler, createRequestLogging, health, openapi } from '#infrastructure/http';
import { Logger } from '#infrastructure/logger';
import { createImageAssets } from '#infrastructure/storage';
import BiliEvent from '#modules/bili-event';
import Dashboard from '#modules/dashboard';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';
import { version } from '~/package.json' with { type: 'json' };

import { adminConfig, WebOrigins } from './config';
import AdminFeature from './features/admin';
import AdminAuthFeature from './features/auth';
import AdminUserFeature from './features/user';
import { AdminAuthCookies, AdminAuthGuard } from './http/auth';
import { AdminHttp } from './http/root';
import { AdminRoutes } from './http/routes/admin';
import { AdminAuthRoutes } from './http/routes/auth';
import { DashboardRoutes } from './http/routes/dashboard';
import { AdminOrderRoutes } from './http/routes/order';
import { PointRoutes } from './http/routes/point';
import { AdminProductRoutes } from './http/routes/product';
import { RewardRoutes } from './http/routes/reward';
import { AdminUserRoutes } from './http/routes/user';

const AdminAppRipples = {
  ...Auth,
  ...BiliEvent,
  ...Dashboard,
  ...Order,
  ...Point,
  ...Product,
  ...Reward,
  ...User,

  ...AdminFeature,
  ...AdminAuthFeature,
  ...AdminUserFeature,

  AdminAuthCookies,
  AdminAuthGuard,

  AdminAuthRoutes,
  AdminOrderRoutes,
  AdminProductRoutes,
  AdminRoutes,
  AdminUserRoutes,
  DashboardRoutes,
  PointRoutes,
  RewardRoutes,

  AdminHttp,
};

// Elysia 插件持有容器: HTTP 停止时由它关闭依赖图。
const container = elysiaCyrene();

const runtime = container.decorator.cyrene.use(
  ...Object.values(AdminAppRipples),
  Logger,
  ImageSavePath,
  WebOrigins,
);

/** 预热应用容器并装配 Admin HTTP 服务。 */
export async function createAdminServer() {
  const config = adminConfig;

  try {
    // 启动期预热: 校验完整依赖图并初始化所有可达 singleton,
    // 重复 key、强依赖环、不可达声明与初始化失败都在这里直接暴露。
    await runtime.init();

    const ripples = runtime.ripples;

    // 启动期业务初始化由组合根触发, 而不是靠模块的隐式副作用。
    await ripples.AdminUseCase.initDefaultAdmin(
      config.superAdmin,
      config.nodeEnv === 'development',
    );

    const logger = ripples.Logger;

    const app = new Elysia({
      name: 'AdminServer',
      serve: {
        port: config.port,
        reusePort: true,
      },
    })
      .use(createRequestLogging(logger, 'admin'))
      .use(
        cors({
          origin: ripples.WebOrigins,
          allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
          exposeHeaders: ['X-Request-Id'],
          credentials: true,
        }),
      )
      // cyrene 插件必须先安装: 它提供容器并负责停止时释放依赖图。
      .use(container)
      .use(ripples.AdminHttp)
      .use(createErrorHandler(logger))
      .use(health)
      .use(createImageAssets({ assets: imageSavePath }))
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

export type AdminApp = Awaited<ReturnType<typeof createAdminServer>>['app'];
