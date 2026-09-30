import { Cyrene } from 'cyrenex';

import AdminFeature from '#apps/admin/features/admin';
import AdminAuthFeature from '#apps/admin/features/auth';
import AdminUserFeature from '#apps/admin/features/user';
import UserAuthFeature from '#apps/user/features/auth';
import {
  biliRoomBinding,
  BiliRoom,
  Database,
  databaseBinding,
  DataSecret,
  dataSecretBinding,
  ImageSavePath,
  imageSavePathBinding,
  ImageStorage,
  JwtSecret,
  jwtSecretBinding,
  Logger,
  loggerBinding,
  Redis,
  redisBinding,
  RegisterCodeTtl,
  registerCodeTtlBinding,
} from '#composition';
import type { DbClient } from '#infrastructure/db';
import { createLogger } from '#infrastructure/logger';
import type { RedisClient } from '#infrastructure/redis';
import { LocalImageStorage } from '#infrastructure/storage';
import Auth from '#modules/auth';
import BiliEvent from '#modules/bili-event';
import Dashboard from '#modules/dashboard';
import Order from '#modules/order';
import Point from '#modules/point';
import Product from '#modules/product';
import Reward from '#modules/reward';
import User from '#modules/user';

/**
 * 集成测试用的全量模块依赖图。
 *
 * 与 App 组合根一样是显式清单, 只是把 Admin App 的 feature 也装了进来,
 * 便于在同一个 Runtime 里覆盖跨模块事务。
 */
const TestRipples = {
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
  ...UserAuthFeature,
};

export interface TestContainerOptions {
  db: DbClient;
  redis: RedisClient;
  imageSavePath?: string;
}

/** 只绑这张测试依赖图真正可达的令牌 —— 不可达的绑定会被构图直接拒绝。 */
export function createTestContainer({ db, redis, imageSavePath = '' }: TestContainerOptions) {
  return new Cyrene()
    .use(...Object.values(TestRipples))
    .override(Database, databaseBinding(db))
    .override(Redis, redisBinding(redis))
    .override(Logger, loggerBinding(createLogger({ level: 'silent', pretty: false })))
    .override(DataSecret, dataSecretBinding('test-data-secret'))
    .override(BiliRoom, biliRoomBinding(721))
    .override(RegisterCodeTtl, registerCodeTtlBinding(300))
    .override(JwtSecret, jwtSecretBinding('test-jwt-secret'))
    .override(ImageSavePath, imageSavePathBinding(imageSavePath))
    .override(ImageStorage, LocalImageStorage);
}
