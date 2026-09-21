import { Cyrene, defineRipples } from 'cyrenejs';

import AdminFeature from '#apps/admin/features/admin';
import AdminAuthFeature from '#apps/admin/features/auth';
import AdminUserFeature from '#apps/admin/features/user';
import UserAuthFeature from '#apps/user/features/auth';
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
const TestRipples = defineRipples({
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
});

export interface TestContainerOptions {
  db: DbClient;
  redis: RedisClient;
  imageSavePath?: string;
}

export function createTestContainer({ db, redis, imageSavePath = '' }: TestContainerOptions) {
  return new Cyrene({
    ripples: TestRipples,
    bindings: [
      databaseBinding(db),
      redisBinding(redis),
      loggerBinding(createLogger({ level: 'silent', pretty: false })),
      dataSecretBinding('test-data-secret'),
      biliRoomBinding(721),
      registerCodeTtlBinding(300),
      jwtSecretBinding('test-jwt-secret'),
      apiOriginBinding('http://api.test.localhost'),
      webOriginsBinding(['http://test.localhost']),
      imageSavePathBinding(imageSavePath),
      imageStorageBinding(LocalImageStorage),
    ],
  });
}
