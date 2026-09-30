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
  Mailer,
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
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

import { userConfig } from './config';
import UserAuthFeature from './features/auth';
import UserEmailFeature from './features/email';
import { createUserMailer } from './features/email/mailer';
import { UserAuthCookies, UserAuthGuard } from './http/auth';
import { UserHttp } from './http/root';
import { AuthRoutes } from './http/routes/auth';
import { OrderRoutes } from './http/routes/order';
import { PointAccountRoutes } from './http/routes/point-account';
import { PointConversionRoutes } from './http/routes/point-conversion';
import { PointTransactionRoutes } from './http/routes/point-transaction';
import { ProductRoutes } from './http/routes/product';
import { UserRoutes } from './http/routes/user';

/**
 * User App 的完整依赖图。
 *
 * 显式列出每个节点: 新增 export 不会隐式改变 Runtime 的依赖图。
 */
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

/**
 * User App 的组合根。
 *
 * 一个 App = 一个 Composition Root = 一个 Cyrene 容器。
 */
export async function createUserApp() {
  const config = userConfig;

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.nodeEnv === 'development',
  });

  const db = createDatabase(config.databaseUrl);
  const redis = createRedisClient(config.redis, logger);

  // Elysia 插件持有容器: HTTP 停止时由它关闭依赖图。
  const container = elysiaCyrene();

  const runtime = container.decorator.cyrene
    .use(...Object.values(UserAppRipples))
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
    .override(ImageStorage, LocalImageStorage)
    // SMTP 配置是值而不是依赖: 未配置时 createUserMailer 返回明确的降级实现。
    .override(Mailer, createUserMailer(config.mail));

  try {
    // 构图期校验: 不执行工厂, 但会立刻暴露重复 key、强依赖环与不可达的绑定。
    runtime.inspect();

    return {
      config,
      container,
      db,
      logger,
      redis,
      ripples: runtime.ripples,
      runtime,
    };
  } catch (error) {
    await runtime.dispose();
    redis.destroy();
    await db.$client.end().catch(() => undefined);

    throw error;
  }
}

export type UserAppRuntime = Awaited<ReturnType<typeof createUserApp>>;
