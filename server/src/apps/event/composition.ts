import { Cyrene } from 'cyrenex';

import { Logger } from '#infrastructure/logger';
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
 * 配置与基础设施都是声明好的 ripple, 这里只负责注册依赖图并预热。
 */
export async function createEventApp() {
  const config = eventConfig;

  const runtime = new Cyrene().use(...Object.values(EventAppRipples), Logger);

  try {
    // 启动期预热: 校验完整依赖图并初始化所有可达 singleton。
    await runtime.init();

    const ripples = runtime.ripples;
    const logger = ripples.Logger;

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
      healthServer: createEventHealthServer(source, config.port),
      logger,
      runtime,
      source,
      worker,
    });
  } catch (error) {
    // 数据库、Redis 等 owned 资源由容器统一释放。
    await runtime.dispose();

    throw error;
  }
}

export type EventApp = Awaited<ReturnType<typeof createEventApp>>;
