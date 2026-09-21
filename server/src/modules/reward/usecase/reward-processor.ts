import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#composition/tokens';
import type { DbTransaction } from '#infrastructure/db';
import type {
  BiliEvent,
  BiliEventRewardItemSnapshot,
  BiliEventRewardResultSnapshot,
  User,
} from '#infrastructure/db/schema';
import BiliEventModule, {
  BiliEventNotFoundError,
  BiliEventPersistFailedError,
} from '#modules/bili-event';
import Point, { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '#modules/point';
import UserModule, { UserNotFoundError } from '#modules/user';

import {
  calculateBiliGuardPoints,
  getBiliGuardEventTime,
  getErrorSnapshot,
  matchesBiliGuard,
  pickEffectiveRules,
  type BiliGuardRewardEvent,
  type RewardGrantPlanItem,
} from '../domain';
import { RewardRuleRepo } from '../repository';

function getBiliGuardRewardEventSnapshot(biliEvent: BiliEvent) {
  return biliEvent.eventSnapshot as BiliGuardRewardEvent;
}

/**
 * 大航海事件发放处理器。
 *
 * 只负责"给定事件 → 计算奖励计划 → 在事务中发放"这一条链路,
 * 手动创建、查询与回放编排分别由其他能力承担。
 */
export const RewardProcessor = ripple(
  {
    BiliEventRepo: BiliEventModule.BiliEventRepo,
    Database,
    PointAccountRepo: Point.PointAccountRepo,
    PointBalanceUseCase: Point.PointBalanceUseCase,
    PointTransactionRepo: Point.PointTransactionRepo,
    PointTypeQuery: Point.PointTypeQuery,
    RewardRuleRepo,
    UserUseCase: UserModule.UserUseCase,
  },
  ({
    BiliEventRepo,
    Database,
    PointAccountRepo,
    PointBalanceUseCase,
    PointTransactionRepo,
    PointTypeQuery,
    RewardRuleRepo,
    UserUseCase,
  }) => {
    async function previewBiliGuard(event: BiliGuardRewardEvent, executor = Database) {
      const eventTime = getBiliGuardEventTime(event);
      const rules = await RewardRuleRepo.listCandidates(eventTime, executor);
      const matchedRules = rules.filter(rule => matchesBiliGuard(rule, event));
      const effectiveRules = pickEffectiveRules(matchedRules);
      const items: RewardGrantPlanItem[] = [];

      for (const rule of effectiveRules) {
        const pointType = await PointTypeQuery.getAvailableById(rule.pointTypeId, executor);

        items.push({
          ruleSnapshot: rule,
          pointTypeSnapshot: pointType,
          pointTypeId: rule.pointTypeId,
          points: calculateBiliGuardPoints(rule.points, event),
        });
      }

      return items;
    }

    async function recordBiliGuardProcessing(
      event: BiliGuardRewardEvent,
      rewardItems: BiliEventRewardItemSnapshot[],
    ) {
      const biliEvent = await BiliEventRepo.upsertProcessing({
        biliEventId: event.id,
        biliUid: String(event.uid),
        occurredAt: getBiliGuardEventTime(event),
        eventSnapshot: event,
        rewardItemSnapshots: rewardItems,
      });

      return biliEvent ?? null;
    }

    async function markBiliGuardRewardProcessing(biliEventId: string) {
      const biliEvent = await BiliEventRepo.markProcessing(biliEventId);

      if (!biliEvent) {
        throw new BiliEventPersistFailedError('B站事件处理中状态保存失败');
      }
    }

    async function markBiliGuardRewardSucceeded(
      tx: DbTransaction,
      event: BiliGuardRewardEvent,
      user: User,
      rewardResultSnapshots: BiliEventRewardResultSnapshot[],
    ) {
      const biliEvent = await BiliEventRepo.markSucceeded(
        event.id,
        {
          userId: user.id,
          rewardResultSnapshots,
        },
        tx,
      );

      if (!biliEvent) {
        throw new BiliEventPersistFailedError('B站事件成功状态保存失败');
      }
    }

    async function ignoreBiliGuardReward(event: BiliGuardRewardEvent, error: UserNotFoundError) {
      const biliEvent = await BiliEventRepo.markIgnored(event.id, {
        lastErrorCode: error.code,
        lastErrorMessage: error.message,
      });

      if (!biliEvent) {
        throw new BiliEventPersistFailedError('B站事件忽略状态保存失败');
      }

      return {
        event,
        user: null,
        ignored: true,
        items: [],
      };
    }

    async function markBiliGuardRewardFailed(event: BiliGuardRewardEvent, error: unknown) {
      const biliEvent = await BiliEventRepo.markFailed(event.id, getErrorSnapshot(error));

      if (!biliEvent) {
        throw new BiliEventPersistFailedError('B站事件失败状态保存失败');
      }
    }

    async function rewardBiliGuardItem(
      tx: DbTransaction,
      event: BiliGuardRewardEvent,
      user: User,
      item: RewardGrantPlanItem,
    ) {
      const rule = item.ruleSnapshot;

      const account = await PointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: item.pointTypeId,
      });

      const idempotencyKey = PointIdempotencyKey.biliGuard({
        sourceId: event.id,
        ruleId: rule.id,
      });

      // 查下看是否已经发放过奖励
      const existingTransaction = await PointTransactionRepo.findByAccountAndIdempotencyKey(
        {
          accountId: account.id,
          idempotencyKey,
        },
        tx,
      );

      if (existingTransaction) {
        return {
          item: {
            ...item,
            account,
            transaction: existingTransaction,
            // true 表示本次请求命中幂等记录，未重复发放积分。
            duplicated: true,
          },
          snapshot: {
            ruleId: rule.id,
            pointTypeId: item.pointTypeId,
            points: item.points,
            transactionId: existingTransaction.id,
            duplicated: true,
          },
        };
      }

      // 发放匹配的积分
      const result = await PointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: item.pointTypeId,
        delta: item.points,
        sourceType: POINT_CHANGE_SOURCE_TYPE.GuardEvent,
        sourceId: event.id,
        idempotencyKey,
        remark: `大航海积分奖励：${rule.name}`,
        metadata: {
          event,
          rewardItemSnapshot: item,
        },
      });

      return {
        item: {
          ...item,
          account: result.account,
          transaction: result.transaction,
          // false 表示本次请求完成了新的积分发放。
          duplicated: result.duplicated,
        },
        snapshot: {
          ruleId: rule.id,
          pointTypeId: item.pointTypeId,
          points: item.points,
          transactionId: result.transaction.id,
          duplicated: result.duplicated,
        },
      };
    }

    async function executeBiliGuardReward(
      event: BiliGuardRewardEvent,
      rewardItems: BiliEventRewardItemSnapshot[],
    ) {
      try {
        return await Database.transaction(async tx => {
          const user = await UserUseCase.getAvailableByBiliUid(String(event.uid), tx);
          const results = [];
          const rewardResultSnapshots: BiliEventRewardResultSnapshot[] = [];

          for (const item of rewardItems) {
            const result = await rewardBiliGuardItem(tx, event, user, item);

            results.push(result.item);
            rewardResultSnapshots.push(result.snapshot);
          }

          await markBiliGuardRewardSucceeded(tx, event, user, rewardResultSnapshots);

          return {
            event,
            user,
            ignored: false,
            items: results,
          };
        });
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          return await ignoreBiliGuardReward(event, error);
        }

        await markBiliGuardRewardFailed(event, error);
        throw error;
      }
    }

    return {
      previewBiliGuard,

      async rewardBiliGuard(event: BiliGuardRewardEvent) {
        const rewardItems = await previewBiliGuard(event);
        const biliEvent = await recordBiliGuardProcessing(event, rewardItems);

        if (!biliEvent) {
          return null;
        }

        return await executeBiliGuardReward(event, rewardItems);
      },

      /** 按事件快照重新发放奖励，即使当前规则已过期。 */
      async replayBiliGuardEvent(biliEventId: string) {
        const biliEvent = await BiliEventRepo.findByBiliEventId(biliEventId);

        if (!biliEvent) {
          throw new BiliEventNotFoundError();
        }

        await markBiliGuardRewardProcessing(biliEventId);

        return await executeBiliGuardReward(
          getBiliGuardRewardEventSnapshot(biliEvent),
          biliEvent.rewardItemSnapshots,
        );
      },
    };
  },
  { debugName: 'RewardProcessor' },
);

export type RewardProcessor = InferInput<typeof RewardProcessor>;
