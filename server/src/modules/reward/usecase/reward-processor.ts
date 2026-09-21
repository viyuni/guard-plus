import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#composition/tokens';
import type { DbTransaction } from '#infrastructure/db';
import type {
  BiliEventRewardItemSnapshot,
  BiliEventRewardResultSnapshot,
  User,
} from '#infrastructure/db/schema';
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

/**
 * 大航海奖励执行器。
 *
 * 只负责“事件 + 固定奖励计划 → 幂等发放积分”。事件的接入、抢占、租约、
 * 重试和最终状态由调用方负责，避免领域执行器与后台任务状态互相覆盖。
 */
export const RewardProcessor = ripple(
  {
    Database,
    PointAccountRepo: Point.PointAccountRepo,
    PointBalanceUseCase: Point.PointBalanceUseCase,
    PointTransactionRepo: Point.PointTransactionRepo,
    PointTypeQuery: Point.PointTypeQuery,
    RewardRuleRepo,
    UserUseCase: UserModule.UserUseCase,
  },
  ({
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

    return {
      previewBiliGuard,

      async processBiliGuard(
        event: BiliGuardRewardEvent,
        rewardItems: BiliEventRewardItemSnapshot[],
      ) {
        try {
          return await Database.transaction(async tx => {
            const user = await UserUseCase.getAvailableByBiliUid(String(event.uid), tx);
            const items = [];
            const rewardResultSnapshots: BiliEventRewardResultSnapshot[] = [];

            for (const item of rewardItems) {
              const result = await rewardBiliGuardItem(tx, event, user, item);

              items.push(result.item);
              rewardResultSnapshots.push(result.snapshot);
            }

            return {
              event,
              user,
              ignored: false as const,
              ignoreReason: null,
              items,
              rewardResultSnapshots,
            };
          });
        } catch (error) {
          if (!(error instanceof UserNotFoundError)) {
            throw error;
          }

          return {
            event,
            user: null,
            ignored: true as const,
            ignoreReason: getErrorSnapshot(error),
            items: [],
            rewardResultSnapshots: [],
          };
        }
      },
    };
  },
  { debugName: 'RewardProcessor' },
);

export type RewardProcessor = InferInput<typeof RewardProcessor>;
