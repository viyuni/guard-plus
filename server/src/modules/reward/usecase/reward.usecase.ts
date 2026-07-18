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
import {
  BiliEventNotFoundError,
  BiliEventPersistFailedError,
  BiliEventRepository,
  createBiliEventEnvelope,
  readBiliGuardEventSnapshot,
  type BiliGuardEventEnvelope,
  type NormalizedBiliGuardEvent,
} from '#modules/bili-event';
import {
  POINT_CHANGE_SOURCE_TYPE,
  PointIdempotencyKey,
  PointAccountRepository,
  PointBalanceUseCase,
  PointTransactionRepository,
  PointTypeUseCase,
} from '#modules/point';
import { UserNotFoundError, UserUseCase } from '#modules/user';

import {
  RewardPolicy,
  RewardRulePolicy,
  type BiliGuardRewardEvent,
  type BiliGuardRewardEventEnvelope,
  type RewardGrantPlanItem,
} from '../domain';
import { RewardRuleRepository } from '../repository';

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

  async rewardBiliGuard(envelope: BiliGuardRewardEventEnvelope) {
    const event = envelope.event;
    const rewardItems = await this.previewBiliGuard(event);
    const biliEvent = await this.recordBiliGuardProcessing(envelope, rewardItems);

    if (!biliEvent) {
      return null;
    }

    return await this.executeBiliGuardReward(envelope, rewardItems);
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
    envelope: BiliGuardRewardEventEnvelope,
    rewardItems: BiliEventRewardItemSnapshot[],
  ) {
    const event = envelope.event;

    try {
      return await this.deps.db.transaction(async tx => {
        const user = await this.deps.userUseCase.getAvailableByBiliUid(event.user.biliUid, tx);
        const results = [];
        const rewardResultSnapshots: BiliEventRewardResultSnapshot[] = [];

        for (const item of rewardItems) {
          const result = await this.rewardBiliGuardItem(tx, envelope, user, item);

          results.push(result.item);
          rewardResultSnapshots.push(result.snapshot);
        }

        await this.markBiliGuardRewardSucceeded(tx, event, user, rewardResultSnapshots);

        return {
          event: envelope,
          user,
          ignored: false,
          items: results,
        };
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return await this.ignoreBiliGuardReward(envelope, error);
      }

      await this.markBiliGuardRewardFailed(envelope, error);
      throw error;
    }
  }

  private async recordBiliGuardProcessing(
    envelope: BiliGuardRewardEventEnvelope,
    rewardItems: BiliEventRewardItemSnapshot[],
  ) {
    const event = envelope.event;
    const biliEvent = await this.deps.biliEventRepo.upsertProcessing({
      biliEventId: event.id,
      biliUid: event.user.biliUid,
      occurredAt: RewardPolicy.getBiliGuardEventTime(event),
      eventSnapshot: envelope,
      rewardItemSnapshots: rewardItems,
    });

    return biliEvent ?? null;
  }

  private async rewardBiliGuardItem(
    tx: DbTransaction,
    envelope: BiliGuardRewardEventEnvelope,
    user: User,
    item: RewardGrantPlanItem,
  ) {
    const event = envelope.event;
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
        event: envelope,
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

  private async ignoreBiliGuardReward(
    envelope: BiliGuardRewardEventEnvelope,
    error: UserNotFoundError,
  ) {
    const event = envelope.event;
    const biliEvent = await this.deps.biliEventRepo.markIgnored(event.id, {
      lastErrorCode: error.code,
      lastErrorMessage: error.message,
    });

    if (!biliEvent) {
      throw new BiliEventPersistFailedError('B站事件忽略状态保存失败');
    }

    return {
      event: envelope,
      user: null,
      ignored: true,
      items: [],
    };
  }

  private async markBiliGuardRewardFailed(envelope: BiliGuardRewardEventEnvelope, error: unknown) {
    const event = envelope.event;
    const biliEvent = await this.deps.biliEventRepo.markFailed(
      event.id,
      RewardPolicy.getErrorSnapshot(error),
    );

    if (!biliEvent) {
      throw new BiliEventPersistFailedError('B站事件失败状态保存失败');
    }
  }

  private getBiliGuardRewardEventSnapshot(biliEvent: BiliEvent) {
    return readBiliGuardEventSnapshot(biliEvent.eventSnapshot);
  }

  private buildManualBiliGuardEvent(input: CreateManualBiliGuardEventBody): BiliGuardEventEnvelope {
    const openedAt = input.openedAt instanceof Date ? input.openedAt : new Date(input.openedAt);
    const sendTime = Math.floor(openedAt.getTime() / 1000);
    const guardStartTime = sendTime;
    const timestampNormalized = openedAt.getTime();
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

    const event: NormalizedBiliGuardEvent = {
      type: 'guard',
      id,
      roomId,
      occurredAt: timestampNormalized,
      user: {
        biliUid: input.uid,
        username: uname,
        avatarUrl: null,
      },
      message,
      guardType: input.guardType,
      guardName: guard.name,
      quantity: displayTotal,
      quantityNormalized: input.total,
      unit,
      isYear: unit === '年',
      price: priceNormalized,
    };

    return createBiliEventEnvelope({
      source: {
        provider: 'manual',
        channel: 'manual',
        sourceEventId: id,
        receivedAt: Date.now(),
        adapterVersion: 1,
      },
      event,
      raw: input,
    });
  }

  private getManualBiliGuardMeta(guardType: CreateManualBiliGuardEventBody['guardType']) {
    const metas = {
      [BiliGuardType.Zongdu]: {
        name: '总督',
        priceNormalized: 19_998,
      },
      [BiliGuardType.Tidu]: {
        name: '提督',
        priceNormalized: 1_998,
      },
      [BiliGuardType.Jianzhang]: {
        name: '舰长',
        priceNormalized: 198,
      },
    } satisfies Record<
      CreateManualBiliGuardEventBody['guardType'],
      { name: string; priceNormalized: number }
    >;

    return metas[guardType];
  }
}
