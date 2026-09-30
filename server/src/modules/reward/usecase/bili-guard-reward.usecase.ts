import { type InferInput, ripple } from 'cyrenex';

import { Logger } from '#infrastructure/logger';
import BiliEventModule, {
  BiliEventNotFoundError,
  BiliEventPersistFailedError,
} from '#modules/bili-event';

import { getBiliGuardEventTime, getErrorSnapshot, type BiliGuardRewardEvent } from '../domain';
import { RewardProcessor } from './reward-processor';

/** 手动补录、测试和回放使用的同步大航海奖励编排。 */
export const BiliGuardRewardUseCase = ripple(
  'BiliGuardRewardUseCase',
  {
    BiliEventRepo: BiliEventModule.BiliEventRepo,
    Logger,
    RewardProcessor,
  },
  ({ BiliEventRepo, Logger, RewardProcessor }) => {
    async function persistResult(
      event: BiliGuardRewardEvent,
      result: Awaited<ReturnType<typeof RewardProcessor.processBiliGuard>>,
    ) {
      if (result.ignored) {
        const persisted = await BiliEventRepo.markIgnored(event.id, result.ignoreReason);

        if (!persisted) {
          throw new BiliEventPersistFailedError('B站事件忽略状态保存失败');
        }

        Logger.info(
          { event: 'reward.event.ignored', biliEventId: event.id, reason: result.ignoreReason },
          '大航海奖励事件已忽略',
        );

        return result;
      }

      const persisted = await BiliEventRepo.markSucceeded(event.id, {
        userId: result.user.id,
        rewardResultSnapshots: result.rewardResultSnapshots,
      });

      if (!persisted) {
        throw new BiliEventPersistFailedError('B站事件成功状态保存失败');
      }

      Logger.info(
        { event: 'reward.event.succeeded', biliEventId: event.id, userId: result.user.id },
        '大航海奖励事件状态已保存',
      );

      return result;
    }

    async function processPersisted(
      event: BiliGuardRewardEvent,
      rewardItems: Parameters<typeof RewardProcessor.processBiliGuard>[1],
    ) {
      try {
        const result = await RewardProcessor.processBiliGuard(event, rewardItems);

        return await persistResult(event, result);
      } catch (error) {
        Logger.error(
          { event: 'reward.event.failed', biliEventId: event.id, err: error },
          '大航海奖励处理失败',
        );
        const failed = await BiliEventRepo.markFailed(event.id, getErrorSnapshot(error));

        if (!failed) {
          throw new BiliEventPersistFailedError('B站事件失败状态保存失败');
        }

        throw error;
      }
    }

    return {
      async rewardBiliGuard(event: BiliGuardRewardEvent) {
        const rewardItems = await RewardProcessor.previewBiliGuard(event);

        const biliEvent = await BiliEventRepo.upsertProcessing({
          biliEventId: event.id,
          biliUid: String(event.uid),
          occurredAt: getBiliGuardEventTime(event),
          eventSnapshot: event,
          rewardItemSnapshots: rewardItems,
        });

        if (!biliEvent) {
          Logger.info(
            { event: 'reward.event.duplicate', biliEventId: event.id },
            '大航海奖励事件无需重复处理',
          );
          return null;
        }

        return await processPersisted(event, rewardItems);
      },

      async replayBiliGuardEvent(biliEventId: string) {
        Logger.info({ event: 'reward.replay.started', biliEventId }, '开始回放大航海奖励事件');
        const biliEvent = await BiliEventRepo.findByBiliEventId(biliEventId);

        if (!biliEvent) {
          throw new BiliEventNotFoundError();
        }

        const processing = await BiliEventRepo.markProcessing(biliEventId);

        if (!processing) {
          throw new BiliEventPersistFailedError('B站事件处理中状态保存失败');
        }

        return await processPersisted(
          biliEvent.eventSnapshot as BiliGuardRewardEvent,
          biliEvent.rewardItemSnapshots,
        );
      },
    };
  },
);

export type BiliGuardRewardUseCase = InferInput<typeof BiliGuardRewardUseCase>;
