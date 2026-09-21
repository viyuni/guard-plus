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
  mailerBinding,
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
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

import { userConfig } from './config';
import UserAuthFeature from './features/auth';
import UserEmailFeature from './features/email';
import { UserMailer } from './features/email/mailer';
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
const UserAppRipples = defineRipples({
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
});

/**
 * User App 的组合根。
 *
 * 一个 App = 一个 Composition Root = 一个 Cyrene Runtime。
 */
export async function createUserApp() {
  const config = userConfig;

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.nodeEnv === 'development',
  });

  const db = createDatabase(config.databaseUrl);
  const redis = createRedisClient(config.redis, logger);

  const runtime = new Cyrene({
    ripples: UserAppRipples,
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
      // SMTP 配置是值而不是依赖: 未配置时 UserMailer 返回明确的降级实现。
      mailerBinding(UserMailer(config.mail)),
    ],
  });

  try {
    const container = await runtime.start();

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

export type UserAppRuntime = Awaited<ReturnType<typeof createUserApp>>;
