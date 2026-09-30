import { elysiaCyrene } from '@cyrenex/elysia';

import { ImageSavePath } from '#config';
import { Logger } from '#infrastructure/logger';
import Auth from '#modules/auth';
import BiliEvent from '#modules/bili-event';
import Dashboard from '#modules/dashboard';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

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
 * 配置与基础设施都是组合层声明好的 ripple, 这里只负责注册依赖图并预热。
 */
export async function createAdminApp() {
  const config = adminConfig;

  // Elysia 插件持有容器: HTTP 停止时由它关闭依赖图。
  const container = elysiaCyrene();

  const runtime = container.decorator.cyrene.use(
    ...Object.values(AdminAppRipples),
    Logger,
    ImageSavePath,
    WebOrigins,
  );

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

    return {
      config,
      container,
      ripples,
      runtime,
    };
  } catch (error) {
    // 数据库、Redis 等 owned 资源由容器统一释放。
    await runtime.dispose();

    throw error;
  }
}

export type AdminAppRuntime = Awaited<ReturnType<typeof createAdminApp>>;
