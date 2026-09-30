import { Cyrene } from 'cyrenex';

import { Auth as AdminAuth } from '#apps/admin/auth';
import AdminFeature from '#apps/admin/features/admin';
import AdminAuthFeature from '#apps/admin/features/auth';
import AdminUserFeature from '#apps/admin/features/user';
import { Auth as UserAuth } from '#apps/user/auth';
import UserAuthFeature from '#apps/user/features/auth';
import {
  BiliRoom,
  DataSecret,
  ImageSavePath,
  AdminJwtSecret,
  UserJwtSecret,
  RegisterCodeTtl,
} from '#config';
import { Database, type DbClient } from '#infrastructure/db';
import { createLogger, Logger, type AppLogger } from '#infrastructure/logger';
import { Redis, type RedisClient } from '#infrastructure/redis';
import BiliEvent from '#modules/bili-event';
import Dashboard from '#modules/dashboard';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

import { stub } from './stub';

/**
 * 集成测试用的全量模块依赖图。
 *
 * 与 App 组合根一样是显式清单, 只是把 Admin App 的 feature 也装了进来,
 * 便于在同一个 Runtime 里覆盖跨模块事务。
 */
const TestRipples = {
  ...UserAuth,
  AdminTokenUseCase: AdminAuth.AuthUseCase,
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
  ...UserAuthFeature,
};

export interface TestContainerOptions {
  db: DbClient;
  redis: RedisClient;
  imageSavePath?: string;
  logger?: AppLogger;
}

/**
 * 只替换这张测试依赖图真正可达的声明 —— 不可达的替换会被构图直接拒绝。
 * 生产组合根不使用 override, 这里只用于注入测试替身。
 */
export function createTestContainer({
  db,
  redis,
  imageSavePath = '',
  logger,
}: TestContainerOptions) {
  return new Cyrene()
    .use(...Object.values(TestRipples))
    .override(Database, stub('Database', db))
    .override(Redis, stub('Redis', redis))
    .override(Logger, stub('Logger', logger ?? createLogger({ level: 'silent', pretty: false })))
    .override(DataSecret, stub('DataSecret', 'test-data-secret'))
    .override(BiliRoom, stub('BiliRoom', 721))
    .override(RegisterCodeTtl, stub('RegisterCodeTtl', 300))
    .override(AdminJwtSecret, stub('AdminJwtSecret', 'test-admin-jwt-secret'))
    .override(UserJwtSecret, stub('UserJwtSecret', 'test-user-jwt-secret'))
    .override(ImageSavePath, stub('ImageSavePath', imageSavePath));
}
