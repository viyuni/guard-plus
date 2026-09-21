import { Cyrene, defineRipples } from 'cyrenejs';

import {
  biliRoomBinding,
  databaseBinding,
  dataSecretBinding,
  loggerBinding,
  redisBinding,
  registerCodeTtlBinding,
} from '#composition';
import { createDatabase } from '#infrastructure/db';
import { createLogger } from '#infrastructure/logger';
import { createRedisClient } from '#infrastructure/redis';
import Auth from '#modules/auth';
import BiliEvent from '#modules/bili-event';
import Point from '#modules/point';
import Reward from '#modules/reward';
import User from '#modules/user';

import { eventConfig } from './config';
import { EventHandler } from './handler';

/**
 * Event App 的最小依赖图。
 *
 * 只挑选事件链路需要的 Ripple: 其他 App 使用某个模块,
 * 不代表事件进程需要把整个系统装进 Runtime。
 */
const EventAppRipples = defineRipples({
  BiliEventRepo: BiliEvent.BiliEventRepo,

  BiliPasswordResetRepo: Auth.BiliPasswordResetRepo,
  BiliRegisterRepo: Auth.BiliRegisterRepo,
  BiliPasswordResetUseCase: Auth.BiliPasswordResetUseCase,
  BiliRegisterUseCase: Auth.BiliRegisterUseCase,

  PointAccountRepo: Point.PointAccountRepo,
  PointBalanceUseCase: Point.PointBalanceUseCase,
  PointTransactionRepo: Point.PointTransactionRepo,
  PointTypeQuery: Point.PointTypeQuery,
  PointTypeRepo: Point.PointTypeRepo,

  RewardProcessor: Reward.RewardProcessor,
  RewardRuleRepo: Reward.RewardRuleRepo,

  UserBasicInfoCrypto: User.UserBasicInfoCrypto,
  UserRepo: User.UserRepo,
  UserUseCase: User.UserUseCase,

  EventHandler,
});

/**
 * Event App 的组合根。
 *
 * 一个 App = 一个 Composition Root = 一个 Cyrene Runtime。
 */
export async function createEventApp() {
  const config = eventConfig;

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.nodeEnv === 'development',
  });

  const db = createDatabase(config.databaseUrl);
  const redis = createRedisClient(config.redis, logger);

  const runtime = new Cyrene({
    ripples: EventAppRipples,
    // 事件进程只绑这 6 个令牌: 没有 HTTP 鉴权、图片与邮件配置。
    bindings: [
      databaseBinding(db),
      redisBinding(redis),
      loggerBinding(logger),
      dataSecretBinding(config.dataSecret),
      biliRoomBinding(config.biliRoom),
      registerCodeTtlBinding(config.registerCodeTtlSeconds),
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

export type EventAppRuntime = Awaited<ReturnType<typeof createEventApp>>;
