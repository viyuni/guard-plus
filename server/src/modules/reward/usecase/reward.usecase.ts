import {
  BiliGuardType,
  type BiliEventPageQuery,
  type CreateManualBiliGuardEventBody,
} from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';

import { Database, RewardLogger } from '#context/tokens';
import type { DbTransaction } from '#db';
import type {
  BiliEvent,
  BiliEventRewardItemSnapshot,
  BiliEventRewardResultSnapshot,
  User,
} from '#db/schema';
import { BiliRoom } from '#env/bili';
import {
  biliEventRepo,
  BiliEventNotFoundError,
  BiliEventPersistFailedError,
} from '#modules/bili-event';
import {
  pointAccountRepo,
  pointBalanceUseCase,
  pointTransactionRepo,
  pointTypeUseCase,
} from '#modules/point';
import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '#modules/point';
import { userUseCase, UserNotFoundError } from '#modules/user';

import {
  calculateBiliGuardPoints,
  getBiliGuardEventTime,
  getErrorSnapshot,
  matchesBiliGuard,
  pickEffectiveRules,
  type BiliGuardRewardEvent,
  type RewardGrantPlanItem,
} from '../domain';
import { rewardRuleRepo } from '../repository';

/**
 * 手动大航海事件时长表。
 *
 * 按开通价格区间映射对应的时长（分钟）。
 */
const MANUAL_BILI_GUARD_DURATION_TABLE: Array<{
  min: number;
  max?: number;
  duration: number;
}> = [
  { min: 0, max: 1, duration: 4 },
  { min: 1, max: 5, duration: 6 },
  { min: 5, max: 10, duration: 10 },
  { min: 10, max: 15, duration: 20 },
  { min: 15, max: 30, duration: 30 },
  { min: 30, max: 50, duration: 60 },
  { min: 50, max: 100, duration: 60 * 2 },
  { min: 100, max: 500, duration: 60 * 5 },
  { min: 500, max: 1000, duration: 60 * 30 },
  { min: 1000, max: 2000, duration: 60 * 60 },
  { min: 2000, max: 5000, duration: 60 * 60 * 2 },
  { min: 5000, max: 10000, duration: 60 * 60 * 3 },
  { min: 10000, max: 20000, duration: 60 * 60 * 4 },
  { min: 20000, duration: 60 * 60 * 5 },
];

function getBiliGuardRewardEventSnapshot(biliEvent: BiliEvent) {
  return biliEvent.eventSnapshot as BiliGuardRewardEvent;
}

function getManualBiliGuardDuration(price: number) {
  if (price <= 0) {
    return 30;
  }

  const entry = MANUAL_BILI_GUARD_DURATION_TABLE.find(
    item => price >= item.min && (item.max === undefined || price < item.max),
  );

  return entry?.duration ?? 30;
}

function getManualBiliGuardMeta(guardType: CreateManualBiliGuardEventBody['guardType']) {
  const metas = {
    [BiliGuardType.Zongdu]: {
      name: '总督',
      priceNormalized: 19_998,
      color: '#ff5c7c',
    },
    [BiliGuardType.Tidu]: {
      name: '提督',
      priceNormalized: 1_998,
      color: '#e17aff',
    },
    [BiliGuardType.Jianzhang]: {
      name: '舰长',
      priceNormalized: 198,
      color: '#00aeec',
    },
  } satisfies Record<
    CreateManualBiliGuardEventBody['guardType'],
    { name: string; priceNormalized: number; color: string }
  >;

  return metas[guardType];
}

export const rewardUseCase = ripple(
  {
    biliEventRepo,
    biliRoom: BiliRoom,
    db: Database,
    logger: RewardLogger,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
    pointTypeUseCase,
    rewardRuleRepo,
    userUseCase,
  },
  ({
    biliEventRepo,
    biliRoom,
    db,
    logger,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
    pointTypeUseCase,
    rewardRuleRepo,
    userUseCase,
  }) => {
    async function previewBiliGuard(event: BiliGuardRewardEvent, executor = db) {
      const eventTime = getBiliGuardEventTime(event);
      const rules = await rewardRuleRepo.listCandidates(eventTime, executor);
      const matchedRules = rules.filter(rule => matchesBiliGuard(rule, event));
      const effectiveRules = pickEffectiveRules(matchedRules);
      const items: RewardGrantPlanItem[] = [];

      for (const rule of effectiveRules) {
        const pointType = await pointTypeUseCase.getAvailableById(rule.pointTypeId, executor);

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
      const biliEvent = await biliEventRepo.upsertProcessing({
        biliEventId: event.id,
        biliUid: String(event.uid),
        occurredAt: getBiliGuardEventTime(event),
        eventSnapshot: event,
        rewardItemSnapshots: rewardItems,
      });

      return biliEvent ?? null;
    }

    async function markBiliGuardRewardProcessing(biliEventId: string) {
      const biliEvent = await biliEventRepo.markProcessing(biliEventId);

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
      const biliEvent = await biliEventRepo.markSucceeded(
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
      const biliEvent = await biliEventRepo.markIgnored(event.id, {
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
      const biliEvent = await biliEventRepo.markFailed(event.id, getErrorSnapshot(error));

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

      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: item.pointTypeId,
      });

      const idempotencyKey = PointIdempotencyKey.biliGuard({
        sourceId: event.id,
        ruleId: rule.id,
      });

      // 查下看是否已经发放过奖励
      const existingTransaction = await pointTransactionRepo.findByAccountAndIdempotencyKey(
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
      const result = await pointBalanceUseCase.changeBalance(tx, account, {
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
        return await db.transaction(async tx => {
          const user = await userUseCase.getAvailableByBiliUid(String(event.uid), tx);
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

    async function rewardBiliGuard(event: BiliGuardRewardEvent) {
      const rewardItems = await previewBiliGuard(event);
      const biliEvent = await recordBiliGuardProcessing(event, rewardItems);

      if (!biliEvent) {
        return null;
      }

      return await executeBiliGuardReward(event, rewardItems);
    }

    function buildManualBiliGuardEvent(
      input: CreateManualBiliGuardEventBody,
    ): BiliGuardRewardEvent {
      const openedAt = input.openedAt instanceof Date ? input.openedAt : new Date(input.openedAt);
      const sendTime = Math.floor(openedAt.getTime() / 1000);
      const guardStartTime = sendTime;
      const timestampNormalized = openedAt.getTime();
      const uid = Number(input.uid);
      const guard = getManualBiliGuardMeta(input.guardType);
      const uname = input.uname;
      const unit = input.total >= 12 && input.total % 12 === 0 ? '年' : '月';
      const displayTotal = unit === '年' ? input.total / 12 : input.total;
      const priceNormalized = guard.priceNormalized * input.total;
      const price = priceNormalized * 1000;

      const message =
        input.total === 1
          ? `${uname} 开通了${guard.name}`
          : `${uname} 开通了${guard.name}${displayTotal}${unit}`;

      const roomId = biliRoom ?? 0;
      const id = `${sendTime}:${guardStartTime}:${roomId}:${input.uid}:${input.guardType}:${price}`;

      return {
        cmd: 'USER_TOAST_MSG_V2',
        type: 'guard',
        id,
        isManual: true,
        uid,
        uname,
        face: '',
        message,
        price,
        priceNormalized,
        duration: getManualBiliGuardDuration(priceNormalized),
        color: guard.color,
        guardType: input.guardType,
        total: input.total,
        totalNormalized: input.total,
        isYearGuard: input.total >= 12 && input.total % 12 === 0,
        unit,
        guardName: guard.name,
        guardTotalCount: 1,
        effectId: 0,
        timestamp: guardStartTime,
        timestampNormalized,
        eventListenerUid: 0,
        roomId,
        read: false,
      };
    }

    async function replayRewardBiliGuard(biliEventId: string) {
      const biliEvent = await biliEventRepo.findByBiliEventId(biliEventId);

      if (!biliEvent) {
        throw new BiliEventNotFoundError();
      }

      await markBiliGuardRewardProcessing(biliEventId);

      return await executeBiliGuardReward(
        getBiliGuardRewardEventSnapshot(biliEvent),
        biliEvent.rewardItemSnapshots,
      );
    }

    return {
      pageBiliGuardEvents(query: BiliEventPageQuery) {
        return biliEventRepo.pageBiliGuard(query);
      },

      previewBiliGuard,

      rewardBiliGuard,

      createManualBiliGuardEvent(input: CreateManualBiliGuardEventBody) {
        return rewardBiliGuard(buildManualBiliGuardEvent(input));
      },

      replayRewardBiliGuard,

      async replayRewardBiliGuardByUserId(userId: string) {
        const user = await userUseCase.getAvailableById(userId);
        const biliEvents = await biliEventRepo.listReplayableBiliGuardByBiliUid(user.biliUid);
        const results = [];

        for (const biliEvent of biliEvents) {
          try {
            results.push({
              biliEventId: biliEvent.biliEventId,
              succeeded: true,
              result: await replayRewardBiliGuard(biliEvent.biliEventId),
            });
          } catch (error) {
            const errorSnapshot = getErrorSnapshot(error);

            logger?.warn(
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
    };
  },
  { debugName: 'RewardUseCase' },
);

export type RewardUseCase = InferInput<typeof rewardUseCase>;
