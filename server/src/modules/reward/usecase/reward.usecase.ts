import {
  BiliGuardType,
  type BiliEventPageQuery,
  type CreateManualBiliGuardEventBody,
} from '@shared/schema/reward';

import type { DbClient, DbExecutor, DbTransaction } from '#db';
import type {
  BiliEvent,
  BiliEventRewardItemSnapshot,
  BiliEventRewardResultSnapshot,
  User,
} from '#db/schema';
import type { BiliEventRepository } from '#modules/bili-event';
import { BiliEventNotFoundError, BiliEventPersistFailedError } from '#modules/bili-event';
import type {
  PointAccountRepository,
  PointBalanceUseCase,
  PointTransactionRepository,
  PointTypeUseCase,
} from '#modules/point';
import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '#modules/point';
import type { UserUseCase } from '#modules/user';
import { UserNotFoundError } from '#modules/user';

import {
  RewardPolicy,
  RewardRulePolicy,
  type BiliGuardRewardEvent,
  type RewardGrantPlanItem,
} from '../domain';
import type { RewardRuleRepository } from '../repository';

export interface RewardUseCaseDeps {
  biliRoom?: number;
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTransactionRepo: PointTransactionRepository;
  pointTypeUseCase: PointTypeUseCase;
  biliEventRepo: BiliEventRepository;
  logger?: {
    warn: (payload: Record<string, unknown>, message?: string) => void;
  };
  rewardRuleRepo: RewardRuleRepository;
  userUseCase: UserUseCase;
}

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

export class RewardUseCase {
  constructor(private readonly deps: RewardUseCaseDeps) {}

  pageBiliGuardEvents(query: BiliEventPageQuery) {
    return this.deps.biliEventRepo.pageBiliGuard(query);
  }

  async previewBiliGuard(event: BiliGuardRewardEvent, db?: DbExecutor) {
    const eventTime = RewardPolicy.getBiliGuardEventTime(event);
    const rules = await this.deps.rewardRuleRepo.listCandidates(eventTime, db);
    const matchedRules = rules.filter(rule => RewardRulePolicy.matchesBiliGuard(rule, event));
    const effectiveRules = RewardRulePolicy.pickEffectiveRules(matchedRules);
    const items: RewardGrantPlanItem[] = [];

    for (const rule of effectiveRules) {
      const pointType = await this.deps.pointTypeUseCase.getAvailableById(rule.pointTypeId, db);

      items.push({
        ruleSnapshot: rule,
        pointTypeSnapshot: pointType,
        pointTypeId: rule.pointTypeId,
        points: RewardPolicy.calculateBiliGuardPoints(rule.points, event),
      });
    }

    return items;
  }

  async rewardBiliGuard(event: BiliGuardRewardEvent) {
    const rewardItems = await this.previewBiliGuard(event);
    const biliEvent = await this.recordBiliGuardProcessing(event, rewardItems);

    if (!biliEvent) {
      return null;
    }

    return await this.executeBiliGuardReward(event, rewardItems);
  }

  async createManualBiliGuardEvent(input: CreateManualBiliGuardEventBody) {
    return await this.rewardBiliGuard(this.buildManualBiliGuardEvent(input));
  }

  async replayRewardBiliGuard(biliEventId: string) {
    const biliEvent = await this.deps.biliEventRepo.findByBiliEventId(biliEventId);

    if (!biliEvent) {
      throw new BiliEventNotFoundError();
    }

    await this.markBiliGuardRewardProcessing(biliEventId);

    return await this.executeBiliGuardReward(
      this.getBiliGuardRewardEventSnapshot(biliEvent),
      biliEvent.rewardItemSnapshots,
    );
  }

  async replayRewardBiliGuardByUserId(userId: string) {
    const user = await this.deps.userUseCase.getAvailableById(userId);
    const biliEvents = await this.deps.biliEventRepo.listReplayableBiliGuardByBiliUid(user.biliUid);
    const results = [];

    for (const biliEvent of biliEvents) {
      try {
        results.push({
          biliEventId: biliEvent.biliEventId,
          succeeded: true,
          result: await this.replayRewardBiliGuard(biliEvent.biliEventId),
        });
      } catch (error) {
        const errorSnapshot = RewardPolicy.getErrorSnapshot(error);

        this.deps.logger?.warn(
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
  }

  private async executeBiliGuardReward(
    event: BiliGuardRewardEvent,
    rewardItems: BiliEventRewardItemSnapshot[],
  ) {
    try {
      return await this.deps.db.transaction(async tx => {
        const user = await this.deps.userUseCase.getAvailableByBiliUid(String(event.uid), tx);
        const results = [];
        const rewardResultSnapshots: BiliEventRewardResultSnapshot[] = [];

        for (const item of rewardItems) {
          const result = await this.rewardBiliGuardItem(tx, event, user, item);

          results.push(result.item);
          rewardResultSnapshots.push(result.snapshot);
        }

        await this.markBiliGuardRewardSucceeded(tx, event, user, rewardResultSnapshots);

        return {
          event,
          user,
          ignored: false,
          items: results,
        };
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return await this.ignoreBiliGuardReward(event, error);
      }

      await this.markBiliGuardRewardFailed(event, error);
      throw error;
    }
  }

  private async recordBiliGuardProcessing(
    event: BiliGuardRewardEvent,
    rewardItems: BiliEventRewardItemSnapshot[],
  ) {
    const biliEvent = await this.deps.biliEventRepo.upsertProcessing({
      biliEventId: event.id,
      biliUid: String(event.uid),
      occurredAt: RewardPolicy.getBiliGuardEventTime(event),
      eventSnapshot: event,
      rewardItemSnapshots: rewardItems,
    });

    return biliEvent ?? null;
  }

  private async rewardBiliGuardItem(
    tx: DbTransaction,
    event: BiliGuardRewardEvent,
    user: User,
    item: RewardGrantPlanItem,
  ) {
    const rule = item.ruleSnapshot;

    const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
      userId: user.id,
      pointTypeId: item.pointTypeId,
    });

    const idempotencyKey = PointIdempotencyKey.biliGuard({
      sourceId: event.id,
      ruleId: rule.id,
    });

    // 查下看是否已经发放过奖励
    const existingTransaction = await this.deps.pointTransactionRepo.findByAccountAndIdempotencyKey(
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
    const result = await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
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

  private async markBiliGuardRewardSucceeded(
    tx: DbTransaction,
    event: BiliGuardRewardEvent,
    user: User,
    rewardResultSnapshots: BiliEventRewardResultSnapshot[],
  ) {
    const biliEvent = await this.deps.biliEventRepo.markSucceeded(
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

  private async markBiliGuardRewardProcessing(biliEventId: string) {
    const biliEvent = await this.deps.biliEventRepo.markProcessing(biliEventId);

    if (!biliEvent) {
      throw new BiliEventPersistFailedError('B站事件处理中状态保存失败');
    }
  }

  private async ignoreBiliGuardReward(event: BiliGuardRewardEvent, error: UserNotFoundError) {
    const biliEvent = await this.deps.biliEventRepo.markIgnored(event.id, {
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

  private async markBiliGuardRewardFailed(event: BiliGuardRewardEvent, error: unknown) {
    const biliEvent = await this.deps.biliEventRepo.markFailed(
      event.id,
      RewardPolicy.getErrorSnapshot(error),
    );

    if (!biliEvent) {
      throw new BiliEventPersistFailedError('B站事件失败状态保存失败');
    }
  }

  private getBiliGuardRewardEventSnapshot(biliEvent: BiliEvent) {
    return biliEvent.eventSnapshot as BiliGuardRewardEvent;
  }

  private buildManualBiliGuardEvent(input: CreateManualBiliGuardEventBody): BiliGuardRewardEvent {
    const openedAt = input.openedAt instanceof Date ? input.openedAt : new Date(input.openedAt);
    const sendTime = Math.floor(openedAt.getTime() / 1000);
    const guardStartTime = sendTime;
    const timestampNormalized = openedAt.getTime();
    const uid = Number(input.uid);
    const guard = this.getManualBiliGuardMeta(input.guardType);
    const uname = input.uname;
    const unit = input.total >= 12 && input.total % 12 === 0 ? '年' : '月';
    const displayTotal = unit === '年' ? input.total / 12 : input.total;
    const priceNormalized = guard.priceNormalized * input.total;
    const price = priceNormalized * 1000;

    const message =
      input.total === 1
        ? `${uname} 开通了${guard.name}`
        : `${uname} 开通了${guard.name}${displayTotal}${unit}`;

    const roomId = this.deps.biliRoom ?? 0;
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
      duration: this.getManualBiliGuardDuration(priceNormalized),
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

  private getManualBiliGuardDuration(price: number) {
    if (price <= 0) {
      return 30;
    }

    const entry = MANUAL_BILI_GUARD_DURATION_TABLE.find(
      item => price >= item.min && (item.max === undefined || price < item.max),
    );

    return entry?.duration ?? 30;
  }

  private getManualBiliGuardMeta(guardType: CreateManualBiliGuardEventBody['guardType']) {
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
}
