import type { DbTransaction } from '#db';
import type { PointAccount, PointTransaction } from '#db/schema';
import { UserUseCase } from '#modules/user';

import type { ChangeBalanceInput } from '../domain';
import {
  PointAccountMismatchError,
  PointAccountPolicy,
  PointAmountPolicy,
  PointTransactionCreateFailedError,
  PointTransactionIdempotencyConflictError,
  PointTransactionPolicy,
} from '../domain';
import { PointAccountRepository } from '../repository/point-account.repo';
import { PointTransactionRepository } from '../repository/point-transaction.repo';
import type { PointTypeUseCase } from './point-type.usecase';

export class PointBalanceUseCase {
  constructor(
    private readonly deps: {
      pointAccountRepo: PointAccountRepository;
      pointTransactionRepo: PointTransactionRepository;
      pointTypeUseCase: PointTypeUseCase;
      userUseCase: UserUseCase;
    },
  ) {}

  async changeBalance(tx: DbTransaction, lockedAccount: PointAccount, input: ChangeBalanceInput) {
    PointAmountPolicy.assertNonZeroInteger(input.delta);
    PointTransactionPolicy.assertDeltaMatchesType(input.type, input.delta);
    this.assertAccountMatchesInput(lockedAccount, input);

    const existingTransaction = await this.deps.pointTransactionRepo.findByAccountAndIdempotencyKey(
      {
        accountId: lockedAccount.id,
        idempotencyKey: input.idempotencyKey,
      },
      tx,
    );

    if (existingTransaction) {
      this.assertExistingTransactionMatchesInput(existingTransaction, input);

      return {
        transaction: existingTransaction,
        account: lockedAccount,
        duplicated: true,
      };
    }

    // 获取积分类型, 用于存快照
    const pointType = await this.deps.pointTypeUseCase.getAvailableById(input.pointTypeId, tx);

    // 获取用户
    const user = await this.deps.userUseCase.getAvailableById(input.userId, tx);

    let updatedAccount: PointAccount;

    if (input.delta > 0) {
      // 添加积分
      PointAccountPolicy.assertCanIncrease(lockedAccount);

      updatedAccount = await this.deps.pointAccountRepo.increaseBalance(tx, {
        accountId: lockedAccount.id,
        amount: input.delta,
      });
    } else {
      // 扣除积分
      const amount = Math.abs(input.delta);

      PointAccountPolicy.assertCanConsume(lockedAccount);
      PointAccountPolicy.assertSufficientBalance(lockedAccount, amount);

      updatedAccount = await this.deps.pointAccountRepo.decreaseBalance(tx, {
        accountId: lockedAccount.id,
        amount,
      });
    }

    // 创建积分流水
    const transaction = await this.deps.pointTransactionRepo.create(tx, {
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
  }

  private assertAccountMatchesInput(account: PointAccount, input: ChangeBalanceInput) {
    if (account.userId !== input.userId || account.pointTypeId !== input.pointTypeId) {
      throw new PointAccountMismatchError();
    }
  }

  private assertExistingTransactionMatchesInput(
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
}
