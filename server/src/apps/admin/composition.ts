import { elysiaCyrene } from '@cyrenex/elysia';

import {
  apiOriginBinding,
  ApiOrigin,
  biliRoomBinding,
  BiliRoom,
  databaseBinding,
  Database,
  dataSecretBinding,
  DataSecret,
  imageSavePathBinding,
  ImageSavePath,
  ImageStorage,
  jwtSecretBinding,
  JwtSecret,
  loggerBinding,
  Logger,
  redisBinding,
  Redis,
  registerCodeTtlBinding,
  RegisterCodeTtl,
  webOriginsBinding,
  WebOrigins,
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

/**
 * Admin App 的组合根。
 *
 * 一个 App = 一个 Composition Root = 一个 Cyrene 容器。
 */
export async function createAdminApp() {
  const config = adminConfig;

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.nodeEnv === 'development',
  });

  const db = createDatabase(config.databaseUrl);
  const redis = createRedisClient(config.redis, logger);

  // Elysia 插件持有容器: HTTP 停止时由它关闭依赖图。
  const container = elysiaCyrene();

  const runtime = container.decorator.cyrene
    .use(...Object.values(AdminAppRipples))
    // 逐令牌绑定: 只列这张依赖图真正需要的令牌。
    .override(Database, databaseBinding(db))
    .override(Redis, redisBinding(redis))
    .override(Logger, loggerBinding(logger))
    .override(DataSecret, dataSecretBinding(config.dataSecret))
    .override(BiliRoom, biliRoomBinding(config.biliRoom))
    .override(RegisterCodeTtl, registerCodeTtlBinding(config.registerCodeTtlSeconds))
    .override(JwtSecret, jwtSecretBinding(config.jwtSecret))
    .override(ApiOrigin, apiOriginBinding(config.apiOrigin))
    .override(WebOrigins, webOriginsBinding(config.webOrigins))
    .override(ImageSavePath, imageSavePathBinding(config.imageSavePath))
    .override(ImageStorage, LocalImageStorage);

  try {
    // 构图期校验: 不执行工厂, 但会立刻暴露重复 key、强依赖环与不可达的绑定。
    runtime.inspect();

    const ripples = runtime.ripples;

    // 启动期业务初始化由组合根触发, 而不是靠模块的隐式副作用。
    await ripples.AdminUseCase.initDefaultAdmin(
      config.superAdmin,
      config.nodeEnv === 'development',
    );

    return {
      config,
      container,
      db,
      logger,
      redis,
      ripples,
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
