import type { ReversalPointTransactionBody } from '@shared/schema/point-account';
import type {
  PointTransactionPageQuery,
  PointTransactionType,
} from '@shared/schema/point-transaction';

import type { DbClient } from '#db';

import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey, PointTransactionPolicy } from '../domain';
import { PointAccountRepository, PointTransactionRepository } from '../repository';
import { PointBalanceUseCase } from './point-balance.usecase';

export interface PointTransactionUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTransactionRepo: PointTransactionRepository;
}

export class PointTransactionUseCase {
  constructor(private readonly deps: PointTransactionUseCaseDeps) {}

  /**
   * 冲正积分流水
   */
  async reversal(adminId: string, data: ReversalPointTransactionBody) {
    return this.deps.db.transaction(async tx => {
      // 获取原始积分交易记录并行锁
      const original = await this.deps.pointTransactionRepo.requireByIdForUpdate(
        tx,
        data.transactionId,
      );

      const existingReversal =
        await this.deps.pointTransactionRepo.findReversalByOriginalTransactionId(original.id, tx);

      PointTransactionPolicy.assertCanReverse(original, existingReversal);

      // 锁账户
      const account = await this.deps.pointAccountRepo.requireByIdForUpdate(
        tx,
        original.pointAccountId,
      );

      //  反转
      const reversalDelta = PointTransactionPolicy.reversalDelta(original);

      return await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'reversal',
        userId: original.userId,
        pointTypeId: original.pointTypeId,
        delta: reversalDelta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.Reversal,
        sourceId: original.id,
        idempotencyKey: PointIdempotencyKey.reversal({ transactionId: original.id }),
        remark: data.remark ?? '积分流水冲正',
        metadata: {
          originalTransactionId: original.id,
          operatorId: adminId,
        },
        reversalOfTransactionId: original.id,
      });
    });
  }

  private withTitle<
    T extends {
      type: PointTransactionType;
      delta: number;
      sourceType: string | null;
    },
  >(item: T) {
    return {
      ...item,
      title: PointTransactionPolicy.resolveTitle(item),
    };
  }

  pageManage(query: PointTransactionPageQuery) {
    return this.deps.pointTransactionRepo.pageManage(query).then(res => ({
      ...res,
      items: res.items.map(item => this.withTitle(item)),
    }));
  }

  private toMineItem<
    T extends {
      type: PointTransactionType;
      delta: number;
      sourceType: string | null;
    },
  >(item: T) {
    const { sourceType: _sourceType, ...rest } = item;

    return {
      ...rest,
      title: PointTransactionPolicy.resolveTitle(item),
    };
  }

  async pageMine(userId: string, query: PointTransactionPageQuery) {
    const page = await this.deps.pointTransactionRepo.pageMine({ ...query, userId });

    return {
      ...page,
      items: page.items.map(item => this.toMineItem(item)),
    };
  }
}
