import { Cyrene } from 'cyrenex';

import {
  Database,
  databaseBinding,
  DataSecret,
  dataSecretBinding,
  Logger,
  loggerBinding,
  Redis,
  redisBinding,
  RegisterCodeTtl,
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
import { BiliGuardConsumer, BiliVerificationConsumer } from './consumers';
import { createEventHealthServer } from './http';
import { EventService } from './service';
import { createBilibiliSource } from './source';
import { BiliGuardWorker } from './workers';

/**
 * Event App 的最小依赖图。
 *
 * 只挑选事件链路需要的 Ripple: 其他 App 使用某个模块,
 * 不代表事件进程需要把整个系统装进 Runtime。
 */
const EventAppRipples = {
  BiliEventRepo: BiliEvent.BiliEventRepo,

  BiliPasswordResetRepo: Auth.BiliPasswordResetRepo,
  BiliRegisterRepo: Auth.BiliRegisterRepo,
  BiliVerificationMatcher: Auth.BiliVerificationMatcher,

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

  BiliGuardConsumer,
  BiliVerificationConsumer,
};

/**
 * Event App 的组合根。
 *
 * 一个 App = 一个 Composition Root = 一个 Cyrene 容器。
 */
export async function createEventApp() {
  const config = eventConfig;

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.nodeEnv === 'development',
  });

  const db = createDatabase(config.databaseUrl);
  const redis = createRedisClient(config.redis, logger);

  const runtime = new Cyrene()
    .use(...Object.values(EventAppRipples))
    // 事件进程只绑这条链路真正用到的令牌: 没有 HTTP 鉴权、图片与邮件配置。
    .override(Database, databaseBinding(db))
    .override(Redis, redisBinding(redis))
    .override(Logger, loggerBinding(logger))
    .override(DataSecret, dataSecretBinding(config.dataSecret))
    .override(RegisterCodeTtl, registerCodeTtlBinding(config.registerCodeTtlSeconds));

  try {
    // 构图期校验: 不执行工厂, 但会立刻暴露重复 key、强依赖环与不可达的绑定。
    runtime.inspect();

    const ripples = runtime.ripples;

    const worker = new BiliGuardWorker(
      {
        biliEventRepo: ripples.BiliEventRepo,
        logger,
        rewardProcessor: ripples.RewardProcessor,
      },
      config.worker,
    );

    const source = createBilibiliSource(config, {
      guardConsumer: ripples.BiliGuardConsumer,
      logger,
      verificationConsumer: ripples.BiliVerificationConsumer,
      wakeGuardWorker: () => worker.wake(),
    });

    return new EventService({
      db,
      healthServer: createEventHealthServer(source, config.port),
      logger,
      redis,
      runtime,
      source,
      worker,
    });
  } catch (error) {
    await runtime.dispose();
    redis.destroy();
    await db.$client.end().catch(() => undefined);

    throw error;
  }
}

export type EventApp = Awaited<ReturnType<typeof createEventApp>>;
