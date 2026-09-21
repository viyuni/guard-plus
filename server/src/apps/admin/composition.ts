import { Cyrene, defineRipples } from 'cyrenejs';

import {
  apiOriginBinding,
  biliRoomBinding,
  databaseBinding,
  dataSecretBinding,
  imageSavePathBinding,
  imageStorageBinding,
  jwtSecretBinding,
  loggerBinding,
  redisBinding,
  registerCodeTtlBinding,
  webOriginsBinding,
} from '#composition';
import { createDatabase } from '#infrastructure/db';
import { createLogger } from '#infrastructure/logger';
import { createRedisClient } from '#infrastructure/redis';
import { LocalImageStorage } from '#infrastructure/storage';
import Auth from '#modules/auth';
import BiliEvent from '#modules/bili-event';
import Dashboard from '#modules/dashboard';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

import { adminConfig } from './config';
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

/**
 * Admin App 的完整依赖图。
 *
 * 显式列出每个节点: 新增 export 不会隐式改变 Runtime 的依赖图。
 */
const AdminAppRipples = defineRipples({
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
});

/**
 * Admin App 的组合根。
 *
 * 一个 App = 一个 Composition Root = 一个 Cyrene Runtime。
 */
export async function createAdminApp() {
  const config = adminConfig;

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.nodeEnv === 'development',
  });

  const db = createDatabase(config.databaseUrl);
  const redis = createRedisClient(config.redis, logger);

  const runtime = new Cyrene({
    ripples: AdminAppRipples,
    // 逐令牌绑定: 只列这张依赖图真正需要的令牌。
    bindings: [
      databaseBinding(db),
      redisBinding(redis),
      loggerBinding(logger),
      dataSecretBinding(config.dataSecret),
      biliRoomBinding(config.biliRoom),
      registerCodeTtlBinding(config.registerCodeTtlSeconds),
      jwtSecretBinding(config.jwtSecret),
      apiOriginBinding(config.apiOrigin),
      webOriginsBinding(config.webOrigins),
      imageSavePathBinding(config.imageSavePath),
      imageStorageBinding(LocalImageStorage),
    ],
  });

  try {
    const container = await runtime.start();

    // 启动期业务初始化由组合根触发, 而不是靠模块的隐式副作用。
    await container.AdminUseCase.initDefaultAdmin(
      config.superAdmin,
      config.nodeEnv === 'development',
    );

    return {
      config,
      container,
      db,
      logger,
      redis,
      runtime,
    };
  } catch (error) {
    await runtime.dispose();
    redis.destroy();
    await db.$client.end().catch(() => undefined);

    throw error;
  }
}

export type AdminAppRuntime = Awaited<ReturnType<typeof createAdminApp>>;
