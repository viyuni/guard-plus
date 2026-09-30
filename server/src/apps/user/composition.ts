import { elysiaCyrene } from '@cyrenex/elysia';

import { ImageSavePath } from '#config';
import { Logger } from '#infrastructure/logger';
import Auth from '#modules/auth';
import BiliEvent from '#modules/bili-event';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

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
 * 配置与基础设施都是组合层声明好的 ripple, 这里只负责注册依赖图并预热。
 */
export async function createUserApp() {
  const config = userConfig;

  // Elysia 插件持有容器: HTTP 停止时由它关闭依赖图。
  const container = elysiaCyrene();

  const runtime = container.decorator.cyrene.use(
    ...Object.values(UserAppRipples),
    Logger,
    ImageSavePath,
    WebOrigins,
  );

  try {
    // 启动期预热: 校验完整依赖图并初始化所有可达 singleton。
    await runtime.init();

    return {
      config,
      container,
      ripples: runtime.ripples,
      runtime,
    };
  } catch (error) {
    // 数据库、Redis 等 owned 资源由容器统一释放。
    await runtime.dispose();

    throw error;
  }
}

export type UserAppRuntime = Awaited<ReturnType<typeof createUserApp>>;
