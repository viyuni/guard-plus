import { expect, it } from 'bun:test';

import { and, count, eq } from 'drizzle-orm';

import { pointAccounts, pointConversionRules, pointTransactions } from '#db/schema';

import {
  PointAccountBannedError,
  PointConversionRuleInvalidError,
  PointConversionRuleNameExistsError,
  PointConversionRulePairExistsError,
  PointTypeNameExistsError,
  PointConversionRuleUnavailableError,
  PointIdempotencyKey,
} from '..';
import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import {
  createConversionRule,
  createDeps,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedConversionFixture,
  seedPointType,
  seedUser,
} from './concurrency-test-utils';

installConcurrencyTestHooks();

describeWithDatabase('积分转换真实数据库并发保护', () => {
  it('积分转换不会并发超扣', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_from_point`);
    const toPointType = await seedPointType(`${prefix}_to_point`);
    const user = await seedUser(`${prefix}_conversion_user`);
    const { pointConversionUseCase } = createDeps();
    const rule = await createConversionRule(prefix, fromPointType.id, toPointType.id);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 3,
      nonce: `${prefix}_grant_from`,
    });

    const results = await runConcurrent(10, index =>
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_${index}`,
      }),
    );

    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });
    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(fromAccount?.balance).toBe(0);
    expect(toAccount?.balance).toBe(30);
  });

  it('积分转换错误规则会被拒绝', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_invalid_conversion_point`);
    const { pointConversionUseCase } = createDeps();

    await expectRejectsInstanceOf(
      pointConversionUseCase.create({
        name: `${prefix}_invalid_rule`,
        fromPointTypeId: pointType.id,
        toPointTypeId: pointType.id,
        toAmount: 1,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换规则创建会拒绝重复名称', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_name_from_point`);
    const toPointType = await seedPointType(`${prefix}_name_to_point`);
    const otherFromPointType = await seedPointType(`${prefix}_name_other_from_point`);
    const otherToPointType = await seedPointType(`${prefix}_name_other_to_point`);
    const { pointConversionUseCase } = createDeps();

    await pointConversionUseCase.create({
      name: `${prefix}_same_name_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      toAmount: 1,
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.create({
        name: `${prefix}_same_name_rule`,
        fromPointTypeId: otherFromPointType.id,
        toPointTypeId: otherToPointType.id,
        toAmount: 1,
      }),
      PointConversionRuleNameExistsError,
    );
  });

  it('积分转换规则创建会拒绝重复来源和目标积分类型', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_pair_from_point`);
    const toPointType = await seedPointType(`${prefix}_pair_to_point`);
    const { pointConversionUseCase } = createDeps();

    await pointConversionUseCase.create({
      name: `${prefix}_first_pair_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      toAmount: 1,
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.create({
        name: `${prefix}_second_pair_rule`,
        fromPointTypeId: fromPointType.id,
        toPointTypeId: toPointType.id,
        toAmount: 1,
      }),
      PointConversionRulePairExistsError,
    );
  });

  it('积分类型更新会拒绝重复名称', async () => {
    const prefix = newBatch();
    const first = await seedPointType(`${prefix}_first_point`);
    const second = await seedPointType(`${prefix}_second_point`);
    const { pointTypeUseCase } = createDeps();

    await expectRejectsInstanceOf(
      pointTypeUseCase.update(second.id, {
        name: first.name,
      }),
      PointTypeNameExistsError,
    );
  });

  it('积分转换规则更新会拒绝重复名称', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_update_name_from_point`);
    const toPointType = await seedPointType(`${prefix}_update_name_to_point`);
    const otherFromPointType = await seedPointType(`${prefix}_update_name_other_from_point`);
    const otherToPointType = await seedPointType(`${prefix}_update_name_other_to_point`);
    const { pointConversionUseCase } = createDeps();
    const first = await pointConversionUseCase.create({
      name: `${prefix}_first_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      toAmount: 1,
    });
    const second = await pointConversionUseCase.create({
      name: `${prefix}_second_rule`,
      fromPointTypeId: otherFromPointType.id,
      toPointTypeId: otherToPointType.id,
      toAmount: 1,
    });

    if (!first || !second) {
      throw new Error('seed conversion rules failed');
    }

    await expectRejectsInstanceOf(
      pointConversionUseCase.update(second.id, {
        name: first.name,
      }),
      PointConversionRuleNameExistsError,
    );
  });

  it('积分转换规则更新会拒绝重复来源和目标积分类型', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_update_pair_from_point`);
    const toPointType = await seedPointType(`${prefix}_update_pair_to_point`);
    const otherFromPointType = await seedPointType(`${prefix}_update_pair_other_from_point`);
    const otherToPointType = await seedPointType(`${prefix}_update_pair_other_to_point`);
    const { pointConversionUseCase } = createDeps();

    await pointConversionUseCase.create({
      name: `${prefix}_first_pair_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      toAmount: 1,
    });
    const second = await pointConversionUseCase.create({
      name: `${prefix}_second_pair_rule`,
      fromPointTypeId: otherFromPointType.id,
      toPointTypeId: otherToPointType.id,
      toAmount: 1,
    });

    if (!second) {
      throw new Error('seed conversion rule failed');
    }

    await expectRejectsInstanceOf(
      pointConversionUseCase.update(second.id, {
        fromPointTypeId: fromPointType.id,
        toPointTypeId: toPointType.id,
      }),
      PointConversionRulePairExistsError,
    );
  });

  it('积分转换规则查重会忽略已软删除的规则', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_deleted_pair_from_point`);
    const toPointType = await seedPointType(`${prefix}_deleted_pair_to_point`);
    const { pointConversionRuleRepo, pointConversionUseCase } = createDeps();
    const rule = await pointConversionUseCase.create({
      name: `${prefix}_deleted_pair_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      toAmount: 1,
    });

    if (!rule) {
      throw new Error('seed conversion rule failed');
    }

    await db
      .update(pointConversionRules)
      .set({ deletedAt: new Date() })
      .where(eq(pointConversionRules.id, rule.id));

    const exists = await pointConversionRuleRepo.findByPointTypePair({
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
    });

    expect(exists).toBeNull();
  });

  it('积分转换规则删除后可复用来源和目标积分类型', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_remove_pair_from_point`);
    const toPointType = await seedPointType(`${prefix}_remove_pair_to_point`);
    const { pointConversionUseCase } = createDeps();
    const removed = await createConversionRule(
      `${prefix}_remove`,
      fromPointType.id,
      toPointType.id,
    );

    await pointConversionUseCase.remove(removed.id);

    const recreated = await pointConversionUseCase.create({
      name: `${prefix}_recreated_rule`,
      fromPointTypeId: fromPointType.id,
      toPointTypeId: toPointType.id,
      toAmount: 1,
    });
    const rules = await pointConversionUseCase.listManage();

    expect(recreated?.id).toBeDefined();
    expect(rules.some(rule => rule.id === removed.id)).toBe(false);
    expect(rules.some(rule => rule.id === recreated?.id)).toBe(true);
  });

  it('积分转换规则用户列表只返回当前可用规则', async () => {
    const prefix = newBatch();
    const now = new Date();
    const past = new Date(now.getTime() - 60_000);
    const future = new Date(now.getTime() + 60_000);
    const { pointConversionUseCase } = createDeps();
    const pointTypes = await Promise.all(
      Array.from({ length: 8 }, (_, index) => seedPointType(`${prefix}_visible_point_${index}`)),
    );
    const [
      visibleFromPointType,
      visibleToPointType,
      disabledFromPointType,
      disabledToPointType,
      notStartedFromPointType,
      notStartedToPointType,
      expiredFromPointType,
      expiredToPointType,
    ] = pointTypes;

    const visible = await createConversionRule(
      `${prefix}_visible`,
      visibleFromPointType!.id,
      visibleToPointType!.id,
      {
        endAt: future,
        startAt: past,
      },
    );
    const disabled = await createConversionRule(
      `${prefix}_disabled`,
      disabledFromPointType!.id,
      disabledToPointType!.id,
      {
        enabled: false,
      },
    );
    const notStarted = await createConversionRule(
      `${prefix}_not_started`,
      notStartedFromPointType!.id,
      notStartedToPointType!.id,
      {
        endAt: new Date(future.getTime() + 60_000),
        startAt: future,
      },
    );
    const expired = await createConversionRule(
      `${prefix}_expired`,
      expiredFromPointType!.id,
      expiredToPointType!.id,
      {
        endAt: past,
        startAt: new Date(past.getTime() - 60_000),
      },
    );

    const manageRules = await pointConversionUseCase.listManage();
    const visibleRules = await pointConversionUseCase.listVisible();

    expect(manageRules.some(rule => rule.id === visible.id)).toBe(true);
    expect(manageRules.some(rule => rule.id === disabled.id)).toBe(true);
    expect(manageRules.some(rule => rule.id === notStarted.id)).toBe(true);
    expect(manageRules.some(rule => rule.id === expired.id)).toBe(true);
    expect(visibleRules.some(rule => rule.id === visible.id)).toBe(true);
    expect(visibleRules.some(rule => rule.id === disabled.id)).toBe(false);
    expect(visibleRules.some(rule => rule.id === notStarted.id)).toBe(false);
    expect(visibleRules.some(rule => rule.id === expired.id)).toBe(false);
  });

  it('积分转换会拒绝非正数转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_non_positive`);

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 0,
        nonce: `${prefix}_zero`,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换按 1:n 扣减来源积分并增加目标积分', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { fromPointType, rule, toPointType, user } = await seedConversionFixture(
      `${prefix}_one_to_many`,
      {
        toAmount: 10,
      },
    );

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 4,
      nonce: `${prefix}_grant_from`,
    });

    await pointConversionUseCase.convert({
      userId: user.id,
      ruleId: rule.id,
      fromAmount: 4,
      nonce: `${prefix}_one_to_many`,
    });

    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });
    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });

    expect(fromAccount?.balance).toBe(0);
    expect(toAccount?.balance).toBe(40);
  });

  it('积分转换会校验单次最小和最大转换数量', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const { rule, user } = await seedConversionFixture(`${prefix}_min_max`, {
      toAmount: 10,
      minConvertAmount: 4,
      maxConvertAmount: 8,
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 2,
        nonce: `${prefix}_below_min`,
      }),
      PointConversionRuleInvalidError,
    );

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 10,
        nonce: `${prefix}_above_max`,
      }),
      PointConversionRuleInvalidError,
    );
  });

  it('积分转换会拒绝停用、未开始和已过期的规则', async () => {
    const prefix = newBatch();
    const { pointConversionUseCase } = createDeps();
    const disabled = await seedConversionFixture(`${prefix}_disabled`, {
      enabled: false,
    });
    const future = await seedConversionFixture(`${prefix}_future`, {
      startAt: new Date(Date.now() + 60_000),
    });
    const expired = await seedConversionFixture(`${prefix}_expired`, {
      startAt: new Date(Date.now() - 120_000),
      endAt: new Date(Date.now() - 60_000),
    });

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: disabled.user.id,
        ruleId: disabled.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_disabled`,
      }),
      PointConversionRuleUnavailableError,
    );

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: future.user.id,
        ruleId: future.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_future`,
      }),
      PointConversionRuleUnavailableError,
    );

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: expired.user.id,
        ruleId: expired.rule.id,
        fromAmount: 2,
        nonce: `${prefix}_expired`,
      }),
      PointConversionRuleUnavailableError,
    );
  });

  it('积分转换重复提交不会重复扣加或重复流水', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_dup_from_point`);
    const toPointType = await seedPointType(`${prefix}_dup_to_point`);
    const user = await seedUser(`${prefix}_dup_conversion_user`);
    const { pointConversionUseCase } = createDeps();
    const rule = await createConversionRule(`${prefix}_dup`, fromPointType.id, toPointType.id);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 5,
      nonce: `${prefix}_grant_from`,
    });

    const results = await runConcurrent(5, () =>
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_same_nonce`,
      }),
    );

    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });
    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });
    const [consumeRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.conversionConsume({
            ruleId: rule.id,
            nonce: `${prefix}_same_nonce`,
          }),
        ),
      );
    const [grantRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.conversionGrant({
            ruleId: rule.id,
            nonce: `${prefix}_same_nonce`,
          }),
        ),
      );

    expect(countFulfilled(results)).toBe(5);
    expect(countRejected(results)).toBe(0);
    expect(fromAccount?.balance).toBe(4);
    expect(toAccount?.balance).toBe(10);
    expect(consumeRows?.total).toBe(1);
    expect(grantRows?.total).toBe(1);
  });

  it('积分转换目标账户失败时会回滚来源扣减', async () => {
    const prefix = newBatch();
    const fromPointType = await seedPointType(`${prefix}_rollback_from_point`);
    const toPointType = await seedPointType(`${prefix}_rollback_to_point`);
    const user = await seedUser(`${prefix}_rollback_conversion_user`);
    const { pointAccountUseCase, pointConversionUseCase } = createDeps();
    const rule = await createConversionRule(`${prefix}_rollback`, fromPointType.id, toPointType.id);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: fromPointType.id,
      delta: 3,
      nonce: `${prefix}_grant_from`,
    });

    await pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
      userId: user.id,
      pointTypeId: toPointType.id,
      delta: 1,
      nonce: `${prefix}_ensure_to`,
    });
    await pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
      userId: user.id,
      pointTypeId: toPointType.id,
      delta: -1,
      nonce: `${prefix}_reset_to`,
    });

    await db
      .update(pointAccounts)
      .set({ status: 'banned' })
      .where(and(eq(pointAccounts.userId, user.id), eq(pointAccounts.pointTypeId, toPointType.id)));

    await expectRejectsInstanceOf(
      pointConversionUseCase.convert({
        userId: user.id,
        ruleId: rule.id,
        fromAmount: 1,
        nonce: `${prefix}_rollback`,
      }),
      PointAccountBannedError,
    );

    const fromAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: fromPointType.id },
    });
    const toAccount = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: toPointType.id },
    });
    const [conversionRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.sourceId, `${rule.id}:${prefix}_rollback`));

    expect(fromAccount?.balance).toBe(3);
    expect(toAccount?.balance).toBe(0);
    expect(conversionRows?.total).toBe(0);
  });
});
