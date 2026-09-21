import type { Guard } from '@viyuni/bevent-relay/events';
import { Worker } from 'bunqueue/client';
import { type InferInput, ripple } from 'cyrenejs';

import { Logger } from '#composition/tokens';
import { BILIBILI_EVENT_QUEUE_NAME, publishBilibiliGuardEvent } from '#infrastructure/queue';
import Auth from '#modules/auth';
import Reward from '#modules/reward';

export interface BiliMessageEvent {
  content: string;
  uid: number;
  uname: string;
}

/**
 * 事件进程的业务事件入口。
 *
 * 大航海事件先入队再消费, 保证发放失败可以重试; 弹幕消息直接匹配
 * 注册码 / 密码重置验证码。持有 bunqueue Worker, 由 Runtime 释放。
 */
export const EventHandler = ripple(
  {
    BiliPasswordResetUseCase: Auth.BiliPasswordResetUseCase,
    BiliRegisterUseCase: Auth.BiliRegisterUseCase,
    Logger,
    RewardProcessor: Reward.RewardProcessor,
  },
  ({ BiliPasswordResetUseCase, BiliRegisterUseCase, Logger, RewardProcessor }) => {
    const worker = new Worker<Guard>(
      BILIBILI_EVENT_QUEUE_NAME,
      job => {
        return RewardProcessor.rewardBiliGuard(job.data);
      },
      {
        embedded: true,
        concurrency: 5,
      },
    );

    return {
      async handleGuardEvent(event: Guard) {
        await publishBilibiliGuardEvent(event);

        Logger.info(event, 'Bilibili Guard Message');
      },

      handleMessage(event: BiliMessageEvent) {
        const input = {
          code: event.content,
          biliUid: event.uid.toString(),
          biliName: event.uname,
        };

        BiliRegisterUseCase.matchMessage(input).catch(error =>
          Logger.error(error, 'Bilibili register message match failed'),
        );

        BiliPasswordResetUseCase.matchMessage(input).catch(error =>
          Logger.error(error, 'Bilibili password reset message match failed'),
        );
      },

      close() {
        return worker.close();
      },
    };
  },
  {
    debugName: 'EventHandler',
    dispose: handler => handler.close(),
  },
);

export type EventHandler = InferInput<typeof EventHandler>;
