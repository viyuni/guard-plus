import { type InferInput, ripple } from 'cyrenejs';

import { Logger } from '#composition/tokens';
import BiliEventModule from '#modules/bili-event';
import UserModule from '#modules/user';

import { getErrorSnapshot } from '../domain';
import { RewardProcessor } from './reward-processor';

/**
 * 奖励回放编排。
 *
 * 回放是可重试任务: 单个事件失败必须被记录并继续处理其余事件。
 */
export const RewardReplayUseCase = ripple(
  {
    BiliEventRepo: BiliEventModule.BiliEventRepo,
    Logger,
    RewardProcessor,
    UserUseCase: UserModule.UserUseCase,
  },
  ({ BiliEventRepo, Logger, RewardProcessor, UserUseCase }) => ({
    replayBiliGuardEvent(biliEventId: string) {
      return RewardProcessor.replayBiliGuardEvent(biliEventId);
    },

    async replayByUserId(userId: string) {
      const user = await UserUseCase.getAvailableById(userId);
      const biliEvents = await BiliEventRepo.listReplayableBiliGuardByBiliUid(user.biliUid);
      const results = [];

      for (const biliEvent of biliEvents) {
        try {
          results.push({
            biliEventId: biliEvent.biliEventId,
            succeeded: true,
            result: await RewardProcessor.replayBiliGuardEvent(biliEvent.biliEventId),
          });
        } catch (error) {
          const errorSnapshot = getErrorSnapshot(error);

          Logger.warn(
            {
              userId: user.id,
              biliUid: user.biliUid,
              biliEventId: biliEvent.biliEventId,
              error: errorSnapshot,
            },
            'Replay BiliGuard reward failed',
          );

          results.push({
            biliEventId: biliEvent.biliEventId,
            succeeded: false,
            error: errorSnapshot,
          });
        }
      }

      return {
        user,
        total: results.length,
        succeeded: results.filter(result => result.succeeded).length,
        failed: results.filter(result => !result.succeeded).length,
        items: results,
      };
    },
  }),
  { debugName: 'RewardReplayUseCase' },
);

export type RewardReplayUseCase = InferInput<typeof RewardReplayUseCase>;
