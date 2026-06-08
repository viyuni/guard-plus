import { expect, it } from 'bun:test';

import { count, eq } from 'drizzle-orm';

import { AuthUseCase as UserAuthUseCase } from '#apps/user/modules/auth/usecase';
import { pointTransactions } from '#db/schema';
import type { BiliRegisterUseCase } from '#modules/auth';
import {
  createDeps,
  createBiliGuardEvent,
  createBiliUid,
  createRewardRule,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedUser,
} from '#test-helpers/concurrency-fixtures';

import { PointIdempotencyKey } from '../../point';
import { type BiliGuardRewardEvent, RewardRuleNameExistsError } from '../domain';

installConcurrencyTestHooks();

describeWithDatabase('奖励发放真实数据库', () => {
  it('奖励规则创建会拒绝重复名称', async () => {
    const prefix = newBatch('reward_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const { rewardRuleUseCase } = createDeps();

    await rewardRuleUseCase.create({
      name: `${prefix}_reward_rule`,
      conditions: {
        type: 'biliGuard',
        guardTypes: [3],
      },
      pointTypeId: pointType.id,
      points: 10,
    });

    await expectRejectsInstanceOf(
      rewardRuleUseCase.create({
        name: `${prefix}_reward_rule`,
        conditions: {
          type: 'biliGuard',
        },
        pointTypeId: pointType.id,
        points: 10,
      }),
      RewardRuleNameExistsError,
    );
  });

  it('奖励规则更新会拒绝重复名称', async () => {
    const prefix = newBatch('reward_update_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const { rewardRuleUseCase } = createDeps();
    const first = await createRewardRule(`${prefix}_first`, pointType.id);
    const second = await createRewardRule(`${prefix}_second`, pointType.id);

    await expectRejectsInstanceOf(
      rewardRuleUseCase.update(second.id, {
        name: first.name,
      }),
      RewardRuleNameExistsError,
    );
  });

  it('同一个大航海事件不会重复发放奖励', async () => {
    const prefix = newBatch('reward');
    const biliUid = createBiliUid();
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`, biliUid);
    const { rewardUseCase } = createDeps();
    const rule = await createRewardRule(prefix, pointType.id, {
      points: 20,
    });
    const event = createBiliGuardEvent(prefix, Number(biliUid), {
      totalNormalized: 3,
    });

    const first = await rewardUseCase.rewardBiliGuard(event);
    const second = await rewardUseCase.rewardBiliGuard(event);

    if (!first) {
      throw new Error('首次大航海奖励应正常处理');
    }

    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [transactionRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.biliGuard({
            sourceId: event.id,
            ruleId: rule.id,
          }),
        ),
      );

    const firstItem = first.items.find(item => item.ruleSnapshot.id === rule.id);
    expect(second).toBeNull();

    expect(firstItem?.points).toBe(60);
    expect(firstItem?.duplicated).toBe(false);
    expect(account?.balance).toBe(60);
    expect(transactionRows?.total).toBe(1);
  });

  it('可以手动创建大航海事件并发放奖励', async () => {
    const prefix = newBatch('manual_guard');
    const biliUid = createBiliUid();
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`, biliUid);
    const { rewardUseCase } = createDeps();
    await createRewardRule(prefix, pointType.id, {
      points: 15,
      conditions: {
        type: 'biliGuard',
        guardTypes: [2],
      },
    });
    const openedAt = new Date('2026-01-02T03:04:05.000Z');

    const result = await rewardUseCase.createManualBiliGuardEvent({
      uid: biliUid,
      total: 2,
      openedAt,
      guardType: 2,
    });

    if (!result) {
      throw new Error('手动大航海事件应正常处理');
    }

    const sendTime = Math.floor(openedAt.getTime() / 1000);
    const guardStartTime = sendTime;
    const price = 1_998_000 * 2;
    const biliEventId = `${sendTime}:${guardStartTime}:721:2:${price}`;
    const event = await db.query.biliEvents.findFirst({
      where: {
        biliEventId,
      },
    });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const snapshot = event?.eventSnapshot as BiliGuardRewardEvent | undefined;

    expect(event?.status).toBe('succeeded');
    expect(event?.occurredAt.getTime()).toBe(openedAt.getTime());
    expect(snapshot?.id).toBe(biliEventId);
    expect(snapshot?.isManual).toBe(true);
    expect(snapshot?.timestamp).toBe(guardStartTime);
    expect(snapshot?.timestampNormalized).toBe(openedAt.getTime());
    expect(snapshot?.guardName).toBe('提督');
    expect(snapshot?.price).toBe(price);
    expect(snapshot?.priceNormalized).toBe(1_998 * 2);
    expect(snapshot?.totalNormalized).toBe(2);
    expect(result.items[0]?.points).toBe(30);
    expect(account?.balance).toBe(30);
  });

  it('只发放匹配大航海类型且同组优先级最高的规则', async () => {
    const prefix = newBatch('reward');
    const noGuardTypesPointType = await seedPointType(`${prefix}_no_guard_types_point`);
    const groupedPointType = await seedPointType(`${prefix}_grouped_point`);
    const ignoredPointType = await seedPointType(`${prefix}_ignored_point`);
    const biliUid = createBiliUid();
    const user = await seedUser(`${prefix}_user`, biliUid);
    const { rewardUseCase } = createDeps();

    await createRewardRule(`${prefix}_no_guard_types`, noGuardTypesPointType.id, {
      points: 5,
      conditions: {
        type: 'biliGuard',
      },
      priority: 5,
    });
    const pickedGroupedRule = await createRewardRule(`${prefix}_picked`, groupedPointType.id, {
      points: 30,
      conditions: {
        type: 'biliGuard',
        guardTypes: [3],
      },
      group: `${prefix}_guard_level`,
      priority: 1,
    });
    const shadowedRule = await createRewardRule(`${prefix}_shadowed`, groupedPointType.id, {
      points: 99,
      conditions: {
        type: 'biliGuard',
        guardTypes: [3],
      },
      group: `${prefix}_guard_level`,
      priority: 10,
    });
    await createRewardRule(`${prefix}_ignored`, ignoredPointType.id, {
      points: 77,
      conditions: {
        type: 'biliGuard',
        guardTypes: [2],
      },
      priority: 0,
    });

    const result = await rewardUseCase.rewardBiliGuard(
      createBiliGuardEvent(prefix, Number(biliUid), {
        totalNormalized: 2,
      }),
    );

    if (!result) {
      throw new Error('首次大航海奖励应正常处理');
    }

    const noGuardTypesAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: noGuardTypesPointType.id },
    });
    const groupedAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: groupedPointType.id },
    });
    const ignoredAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: ignoredPointType.id },
    });

    expect(result.items.map(item => item.ruleSnapshot.id)).toContain(pickedGroupedRule.id);
    expect(result.items.map(item => item.ruleSnapshot.id)).not.toContain(shadowedRule.id);
    expect(noGuardTypesAccount).toBeUndefined();
    expect(groupedAccount?.balance).toBe(60);
    expect(ignoredAccount).toBeUndefined();
  });

  it('大航海规则没有任何 guardTypes 时不会发放奖励', async () => {
    const prefix = newBatch('reward_no_guard_types');
    const pointType = await seedPointType(`${prefix}_point`);
    const biliUid = createBiliUid();
    const user = await seedUser(`${prefix}_user`, biliUid);
    const { rewardUseCase } = createDeps();

    await createRewardRule(prefix, pointType.id, {
      conditions: {
        type: 'biliGuard',
        guardTypes: [],
      },
      points: 10,
    });

    const result = await rewardUseCase.rewardBiliGuard(
      createBiliGuardEvent(prefix, Number(biliUid), {
        totalNormalized: 2,
      }),
    );

    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    expect(result?.items).toEqual([]);
    expect(account).toBeUndefined();
  });

  it('到期规则不会发放奖励', async () => {
    const prefix = newBatch('reward');
    const expiredPointType = await seedPointType(`${prefix}_expired_point`);
    const activePointType = await seedPointType(`${prefix}_active_point`);
    const biliUid = createBiliUid();
    const user = await seedUser(`${prefix}_user`, biliUid);
    const { rewardUseCase } = createDeps();
    const now = new Date('2026-05-12T12:00:00.000Z');

    await createRewardRule(`${prefix}_expired`, expiredPointType.id, {
      points: 50,
      startAt: new Date('2026-05-12T11:00:00'),
      endAt: new Date('2026-05-12T12:00:00'),
    });
    await createRewardRule(`${prefix}_active`, activePointType.id, {
      points: 15,
      startAt: new Date('2026-05-12T11:00:00'),
      endAt: new Date('2026-05-12T13:00:00'),
    });

    const result = await rewardUseCase.rewardBiliGuard(
      createBiliGuardEvent(prefix, Number(biliUid), {
        totalNormalized: 2,
        timestamp: now.getTime(),
      }),
    );

    if (!result) {
      throw new Error('首次大航海奖励应正常处理');
    }

    const expiredAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: expiredPointType.id },
    });
    const activeAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: activePointType.id },
    });

    expect(result.items.map(item => item.pointTypeId)).toContain(activePointType.id);
    expect(result.items.map(item => item.pointTypeId)).not.toContain(expiredPointType.id);
    expect(expiredAccount).toBeUndefined();
    expect(activeAccount?.balance).toBe(30);
  });

  it('奖励成功时记录事件快照、奖励计划快照和执行结果快照', async () => {
    const prefix = newBatch('reward');
    const biliUid = createBiliUid();
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`, biliUid);
    const { rewardUseCase } = createDeps();
    const rule = await createRewardRule(prefix, pointType.id, {
      points: 20,
    });
    const event = createBiliGuardEvent(prefix, Number(biliUid), {
      totalNormalized: 3,
    });

    await rewardUseCase.rewardBiliGuard(event);
    await rewardUseCase.rewardBiliGuard(event);

    const biliEvent = await db.query.biliEvents.findFirst({
      where: {
        biliEventId: event.id,
      },
    });

    expect(biliEvent?.status).toBe('succeeded');
    expect(biliEvent?.userId).toBe(user.id);
    expect(biliEvent?.eventSnapshot).toEqual(event);

    const rewardItemSnapshot = biliEvent?.rewardItemSnapshots.find(
      item => item.ruleSnapshot.id === rule.id,
    );
    const rewardResultSnapshot = biliEvent?.rewardResultSnapshots.find(
      item => item.ruleId === rule.id,
    );

    expect(rewardItemSnapshot?.points).toBe(60);
    expect(rewardItemSnapshot?.pointTypeSnapshot.id).toBe(pointType.id);
    expect(rewardResultSnapshot?.duplicated).toBe(false);
  });

  it('未注册用户事件会记录为 ignored 并保留奖励计划快照', async () => {
    const prefix = newBatch('reward');
    const pointType = await seedPointType(`${prefix}_point`);
    const { rewardUseCase } = createDeps();
    const rule = await createRewardRule(prefix, pointType.id, {
      points: 12,
    });
    const event = createBiliGuardEvent(prefix, Number(createBiliUid()), {
      totalNormalized: 2,
    });

    const result = await rewardUseCase.rewardBiliGuard(event);

    if (!result) {
      throw new Error('首次大航海奖励应正常处理');
    }

    const biliEvent = await db.query.biliEvents.findFirst({
      where: {
        biliEventId: event.id,
      },
    });
    const [transactionRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.sourceId, event.id));

    expect(result.ignored).toBe(true);
    expect(result.user).toBeNull();
    expect(result.items).toHaveLength(0);
    expect(transactionRows?.total).toBe(0);
    expect(biliEvent?.status).toBe('ignored');
    expect(biliEvent?.userId).toBeNull();
    expect(biliEvent?.lastErrorCode).toBe('NOT_FOUND');
    expect(biliEvent?.eventSnapshot).toEqual(event);

    const rewardItemSnapshot = biliEvent?.rewardItemSnapshots.find(
      item => item.ruleSnapshot.id === rule.id,
    );

    expect(rewardItemSnapshot?.points).toBe(24);
    expect(biliEvent?.rewardResultSnapshots).toHaveLength(0);
  });

  it('可以使用奖励快照回放未注册用户事件，即使当前奖励规则已过期', async () => {
    const prefix = newBatch('reward');
    const pointType = await seedPointType(`${prefix}_point`);
    const biliUid = createBiliUid();
    const { rewardUseCase, rewardRuleUseCase } = createDeps();
    const rule = await createRewardRule(prefix, pointType.id, {
      points: 12,
    });
    const event = createBiliGuardEvent(prefix, Number(biliUid), {
      totalNormalized: 2,
    });

    await rewardUseCase.rewardBiliGuard(event);
    await rewardRuleUseCase.update(rule.id, {
      points: 99,
      startAt: new Date('2026-05-12T10:00:00'),
      endAt: new Date('2026-05-12T11:00:00'),
    });
    await createRewardRule(`${prefix}_new_rule`, pointType.id, {
      points: 99,
    });
    const user = await seedUser(`${prefix}_user`, biliUid);
    const replayed = await rewardUseCase.replayRewardBiliGuard(event.id);

    const account = await db.query.pointAccounts.findFirst({
      where: {
        userId: user.id,
        pointTypeId: pointType.id,
      },
    });
    const biliEvent = await db.query.biliEvents.findFirst({
      where: {
        biliEventId: event.id,
      },
    });

    expect(replayed.ignored).toBe(false);
    const replayedItem = replayed.items.find(item => item.ruleSnapshot.id === rule.id);

    expect(replayedItem?.points).toBe(24);
    expect(account?.balance).toBe(24);
    expect(biliEvent?.status).toBe('succeeded');

    const rewardItemSnapshot = biliEvent?.rewardItemSnapshots.find(
      item => item.ruleSnapshot.id === rule.id,
    );
    const rewardResultSnapshot = biliEvent?.rewardResultSnapshots.find(
      item => item.ruleId === rule.id,
    );

    expect(rewardItemSnapshot?.points).toBe(24);
    expect(rewardResultSnapshot?.duplicated).toBe(false);
  });

  it('可以通过 userId 批量回放未注册用户的大航海奖励', async () => {
    const prefix = newBatch('reward');
    const pointType = await seedPointType(`${prefix}_point`);
    const biliUid = createBiliUid();
    const { rewardUseCase } = createDeps();
    const rule = await createRewardRule(prefix, pointType.id, {
      points: 7,
    });
    const firstEvent = createBiliGuardEvent(`${prefix}_first`, Number(biliUid), {
      totalNormalized: 2,
    });
    const secondEvent = createBiliGuardEvent(`${prefix}_second`, Number(biliUid), {
      totalNormalized: 3,
    });

    await rewardUseCase.rewardBiliGuard(firstEvent);
    await rewardUseCase.rewardBiliGuard(secondEvent);
    const user = await seedUser(`${prefix}_user`, biliUid);
    const replayed = await rewardUseCase.replayRewardBiliGuardByUserId(user.id);

    const account = await db.query.pointAccounts.findFirst({
      where: {
        userId: user.id,
        pointTypeId: pointType.id,
      },
    });
    const replayedRuleItems = replayed.items.flatMap(item =>
      (item.result?.items ?? []).filter(rewardItem => rewardItem.ruleSnapshot.id === rule.id),
    );

    expect(replayed.total).toBe(2);
    expect(replayed.succeeded).toBe(2);
    expect(replayed.failed).toBe(0);
    expect(replayedRuleItems.map(item => item.points).sort((a, b) => a - b)).toEqual([14, 21]);
    expect(account?.balance).toBe(35);
  });

  it('普通用户注册成功后会自动回放未注册时的大航海奖励', async () => {
    const prefix = newBatch('reward_register');
    const pointType = await seedPointType(`${prefix}_point`);
    const biliUid = createBiliUid();
    const { authUseCase, rewardUseCase, userUseCase } = createDeps();
    const biliRegisterCode = 'U-234567';
    const verifier = 'test-verifier';
    const userAuthUseCase = new UserAuthUseCase({
      authUseCase,
      biliRegisterUseCase: {
        consumeChallenge: async (code: string, actualVerifier: string | undefined) =>
          code === biliRegisterCode && actualVerifier === verifier
            ? {
                status: 'matched',
                code,
                verifierHash: 'test-verifier-hash',
                biliUid,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 60_000).toISOString(),
              }
            : null,
      } as unknown as BiliRegisterUseCase,
      biliRoom: 8315781,
      rewardUseCase,
      userUseCase,
    });
    const rule = await createRewardRule(prefix, pointType.id, {
      points: 8,
    });
    const event = createBiliGuardEvent(prefix, Number(biliUid), {
      totalNormalized: 4,
    });

    await rewardUseCase.rewardBiliGuard(event);
    const registered = await userAuthUseCase.register(
      {
        biliUid,
        username: `${prefix}_user`,
        password: 'test_password',
      },
      {
        code: biliRegisterCode,
        verifier,
      },
    );

    const account = await db.query.pointAccounts.findFirst({
      where: {
        userId: registered.id,
        pointTypeId: pointType.id,
      },
    });
    const biliEvent = await db.query.biliEvents.findFirst({
      where: {
        biliEventId: event.id,
      },
    });
    const rewardResultSnapshot = biliEvent?.rewardResultSnapshots.find(
      item => item.ruleId === rule.id,
    );

    expect(account?.balance).toBe(32);
    expect(biliEvent?.status).toBe('succeeded');
    expect(biliEvent?.userId).toBe(registered.id);
    expect(rewardResultSnapshot?.duplicated).toBe(false);
  });
});
