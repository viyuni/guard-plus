import { type InferInput, ripple } from 'cyrenejs';

import type { DbTransaction } from '#db';
import type { PointAccount, PointTransaction } from '#db/schema';
import { UserUseCase } from '#modules/user';

import {
  type ChangeBalanceInput,
  PointAccountMismatchError,
  assertPointAccountCanIncrease,
  assertPointAccountCanConsume,
  assertSufficientPointBalance,
  assertNonZeroPointAmount,
  PointTransactionCreateFailedError,
  PointTransactionIdempotencyConflictError,
  assertPointTransactionDeltaMatchesType,
} from '../domain';
import { PointAccountRepo, PointTransactionRepo } from '../repository';
import { PointTypeUseCase } from './point-type.usecase';

export const PointBalanceUseCase = ripple(
  {
    PointAccountRepo,
    PointTransactionRepo,
    PointTypeUseCase,
    UserUseCase,
  },
  ({ PointAccountRepo, PointTransactionRepo, PointTypeUseCase, UserUseCase }) => {
    function assertAccountMatchesInput(account: PointAccount, input: ChangeBalanceInput) {
      if (account.userId !== input.userId || account.pointTypeId !== input.pointTypeId) {
        throw new PointAccountMismatchError();
      }
    }

    function assertExistingTransactionMatchesInput(
      transaction: PointTransaction,
      input: ChangeBalanceInput,
    ) {
      const reversalOfTransactionId =
        input.type === 'reversal' ? input.reversalOfTransactionId : null;

      if (
        transaction.userId !== input.userId ||
        transaction.pointTypeId !== input.pointTypeId ||
        transaction.type !== input.type ||
        transaction.delta !== input.delta ||
        transaction.sourceType !== input.sourceType ||
        transaction.sourceId !== input.sourceId ||
        transaction.reversalOfTransactionId !== reversalOfTransactionId
      ) {
        throw new PointTransactionIdempotencyConflictError();
      }
    }

    return {
      async changeBalance(
        tx: DbTransaction,
        lockedAccount: PointAccount,
        input: ChangeBalanceInput,
      ) {
        assertNonZeroPointAmount(input.delta);
        assertPointTransactionDeltaMatchesType(input.type, input.delta);
        assertAccountMatchesInput(lockedAccount, input);

        const existingTransaction = await PointTransactionRepo.findByAccountAndIdempotencyKey(
          {
            accountId: lockedAccount.id,
            idempotencyKey: input.idempotencyKey,
          },
          tx,
        );

        if (existingTransaction) {
          assertExistingTransactionMatchesInput(existingTransaction, input);

          return {
            transaction: existingTransaction,
            account: lockedAccount,
            duplicated: true,
          };
        }

        // 获取积分类型, 用于存快照
        const pointType = await PointTypeUseCase.getAvailableById(input.pointTypeId, tx);

        // 获取用户
        const user = await UserUseCase.getAvailableById(input.userId, tx);

        let updatedAccount: PointAccount;

        if (input.delta > 0) {
          // 添加积分
          assertPointAccountCanIncrease(lockedAccount);

          updatedAccount = await PointAccountRepo.increaseBalance(tx, {
            accountId: lockedAccount.id,
            amount: input.delta,
          });
        } else {
          // 扣除积分
          const amount = Math.abs(input.delta);

          assertPointAccountCanConsume(lockedAccount);
          assertSufficientPointBalance(lockedAccount, amount);

          updatedAccount = await PointAccountRepo.decreaseBalance(tx, {
            accountId: lockedAccount.id,
            amount,
          });
        }

        // 创建积分流水
        const transaction = await PointTransactionRepo.create(tx, {
          userId: user.id,
          pointAccountId: lockedAccount.id,
          pointTypeId: input.pointTypeId,
          pointTypeNameSnapshot: pointType.name,
          type: input.type,
          delta: input.delta,
          balanceBefore: lockedAccount.balance,
          balanceAfter: updatedAccount.balance,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          idempotencyKey: input.idempotencyKey,
          remark: input.remark,
          metadata: input.metadata,
          // 仅当流水类型为 reversal 时，才记录 reversalOfTransactionId
          reversalOfTransactionId:
            input.type === 'reversal' ? input.reversalOfTransactionId : undefined,
        });

        if (!transaction) {
          throw new PointTransactionCreateFailedError();
        }

        return {
          transaction,
          account: updatedAccount,
          duplicated: false,
        };
      },
    };
  },
  { debugName: 'PointBalanceUseCase' },
);

export type PointBalanceUseCase = InferInput<typeof PointBalanceUseCase>;
