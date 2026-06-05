import { expect, it } from 'bun:test';

import { count, eq } from 'drizzle-orm';

import { pointTransactions } from '#db/schema';

import {
  PointAccountMismatchError,
  PointAmountInvalidError,
  PointIdempotencyKey,
  PointTransactionAlreadyReversedError,
  PointTransactionIdempotencyConflictError,
} from '..';
import {
  countFulfilled,
  countRejected,
  runConcurrent,
} from '../../../__tests__/helpers/concurrency';
import {
  createDeps,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedUser,
} from './concurrency-test-utils';

installConcurrencyTestHooks();

describeWithDatabase('积分账户真实数据库并发保护', () => {
  it('积分余额增加后超出 PostgreSQL integer 范围时返回数量错误', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_overflow_point`);
    const user = await seedUser(`${prefix}_overflow_user`);

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 2_147_483_647,
      nonce: `${prefix}_initial_grant`,
    });

    await expectRejectsInstanceOf(
      grantPoints({
        adminId: `${prefix}_admin`,
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 1,
        nonce: `${prefix}_overflow_grant`,
      }),
      PointAmountInvalidError,
    );

    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    expect(account?.balance).toBe(2_147_483_647);
  });

  it('积分账户不会并发超扣', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_balance_point`);
    const user = await seedUser(`${prefix}_user`);
    const { pointAccountUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 3,
      nonce: `${prefix}_grant`,
    });

    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    if (!account) throw new Error('seed account failed');

    const results = await runConcurrent(10, index =>
      pointAccountUseCase.adjustBalance(`${prefix}_admin_${index}`, {
        userId: user.id,
        pointTypeId: pointType.id,
        delta: -1,
        nonce: `${prefix}_consume_${index}`,
      }),
    );

    const current = await db.query.pointAccounts.findFirst({ where: { id: account.id } });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(current?.balance).toBe(0);
  });

  it('积分流水保持唯一', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_transaction_unique_point`);
    const user = await seedUser(`${prefix}_transaction_user`);
    const { pointAccountUseCase } = createDeps();

    const results = await runConcurrent(5, () =>
      pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
        userId: user.id,
        pointTypeId: pointType.id,
        delta: 1,
        nonce: `${prefix}_same_key`,
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.adminAdjust({
            adminId: `${prefix}_admin`,
            nonce: `${prefix}_same_key`,
          }),
        ),
      );
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    expect(countFulfilled(results)).toBe(5);
    expect(countRejected(results)).toBe(0);
    expect(row?.total).toBe(1);
    expect(account?.balance).toBe(1);
  });

  it('余额变更会拒绝账户和输入参数不匹配', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_mismatch_point`);
    const otherPointType = await seedPointType(`${prefix}_mismatch_other_point`);
    const user = await seedUser(`${prefix}_mismatch_user`);
    const { pointAccountRepo, pointBalanceUseCase } = createDeps();

    await expectRejectsInstanceOf(
      db.transaction(async tx => {
        const account = await pointAccountRepo.ensureAccountAndLock(tx, {
          userId: user.id,
          pointTypeId: pointType.id,
        });

        return pointBalanceUseCase.changeBalance(tx, account, {
          type: 'grant',
          userId: user.id,
          pointTypeId: otherPointType.id,
          delta: 1,
          sourceType: 'test',
          sourceId: `${prefix}_mismatch`,
          idempotencyKey: `${prefix}_mismatch`,
        });
      }),
      PointAccountMismatchError,
    );
  });

  it('同一幂等键不能复用到不同余额变更参数', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_idempotency_conflict_point`);
    const user = await seedUser(`${prefix}_idempotency_conflict_user`);
    const { pointAccountUseCase } = createDeps();
    const input = {
      userId: user.id,
      pointTypeId: pointType.id,
      nonce: `${prefix}_same_nonce`,
    };

    await pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
      ...input,
      delta: 1,
    });

    await expectRejectsInstanceOf(
      pointAccountUseCase.adjustBalance(`${prefix}_admin`, {
        ...input,
        delta: 2,
      }),
      PointTransactionIdempotencyConflictError,
    );
  });

  it('重复冲正只会创建一条冲正流水', async () => {
    const prefix = newBatch();
    const pointType = await seedPointType(`${prefix}_reversal_point`);
    const user = await seedUser(`${prefix}_reversal_user`);
    const { pointTransactionUseCase } = createDeps();
    const grantResult = await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 3,
      nonce: `${prefix}_grant`,
    });

    const results = await runConcurrent(5, () =>
      pointTransactionUseCase.reversal(`${prefix}_admin`, {
        transactionId: grantResult.transaction.id,
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.reversalOfTransactionId, grantResult.transaction.id));
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(results.filter(result => result.status === 'rejected')[0]?.reason).toBeInstanceOf(
      PointTransactionAlreadyReversedError,
    );
    expect(row?.total).toBe(1);
    expect(account?.balance).toBe(0);
  });
});
