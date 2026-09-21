import { type InferInput, ripple } from 'cyrenejs';

import BiliEventModule, {
  BiliEventNotFoundError,
  BiliEventPersistFailedError,
} from '#modules/bili-event';

import { getBiliGuardEventTime, getErrorSnapshot, type BiliGuardRewardEvent } from '../domain';
import { RewardProcessor } from './reward-processor';

/** 手动补录、测试和回放使用的同步大航海奖励编排。 */
export const BiliGuardRewardUseCase = ripple(
  {
    BiliEventRepo: BiliEventModule.BiliEventRepo,
    RewardProcessor,
  },
  ({ BiliEventRepo, RewardProcessor }) => {
    async function persistResult(
      event: BiliGuardRewardEvent,
      result: Awaited<ReturnType<typeof RewardProcessor.processBiliGuard>>,
    ) {
      if (result.ignored) {
        const persisted = await BiliEventRepo.markIgnored(event.id, result.ignoreReason);

        if (!persisted) {
          throw new BiliEventPersistFailedError('B站事件忽略状态保存失败');
        }

        return result;
      }

      const persisted = await BiliEventRepo.markSucceeded(event.id, {
        userId: result.user.id,
        rewardResultSnapshots: result.rewardResultSnapshots,
      });

      if (!persisted) {
        throw new BiliEventPersistFailedError('B站事件成功状态保存失败');
      }

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
          return null;
        }

        return await processPersisted(event, rewardItems);
      },

      async replayBiliGuardEvent(biliEventId: string) {
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
  { debugName: 'BiliGuardRewardUseCase' },
);

export type BiliGuardRewardUseCase = InferInput<typeof BiliGuardRewardUseCase>;
