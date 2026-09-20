import type { ReversalPointTransactionBody } from '@shared/schema/point-account';
import type {
  PointTransactionPageQuery,
  PointTransactionType,
} from '@shared/schema/point-transaction';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointIdempotencyKey,
  assertPointTransactionCanReverse,
  reversalPointTransactionDelta,
  resolvePointTransactionTitle,
} from '../domain';
import { pointAccountRepo, pointTransactionRepo } from '../repository';
import { pointBalanceUseCase } from './point-balance.usecase';

function withTitle<
  T extends {
    type: PointTransactionType;
    delta: number;
    sourceType: string | null;
  },
>(item: T) {
  return {
    ...item,
    title: resolvePointTransactionTitle(item),
  };
}

function toMineItem<
  T extends {
    type: PointTransactionType;
    delta: number;
    sourceType: string | null;
  },
>(item: T) {
  const { sourceType: _sourceType, ...rest } = item;

  return {
    ...rest,
    title: resolvePointTransactionTitle(item),
  };
}

export const pointTransactionUseCase = ripple(
  {
    db: Database,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTransactionRepo,
  },
  ({ db, pointAccountRepo, pointBalanceUseCase, pointTransactionRepo }) => ({
    /**
     * 冲正积分流水
     */
    async reversal(adminId: string, data: ReversalPointTransactionBody) {
      return db.transaction(async tx => {
        // 获取原始积分交易记录并行锁
        const original = await pointTransactionRepo.requireByIdForUpdate(tx, data.transactionId);

        const existingReversal = await pointTransactionRepo.findReversalByOriginalTransactionId(
          original.id,
          tx,
        );

        assertPointTransactionCanReverse(original, existingReversal);

        // 锁账户
        const account = await pointAccountRepo.requireByIdForUpdate(tx, original.pointAccountId);

        //  反转
        const reversalDelta = reversalPointTransactionDelta(original);

        return await pointBalanceUseCase.changeBalance(tx, account, {
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
    },

    pageManage(query: PointTransactionPageQuery) {
      return pointTransactionRepo.pageManage(query).then(res => ({
        ...res,
        items: res.items.map(item => withTitle(item)),
      }));
    },

    async pageMine(userId: string, query: PointTransactionPageQuery) {
      const page = await pointTransactionRepo.pageMine({ ...query, userId });

      return {
        ...page,
        items: page.items.map(item => toMineItem(item)),
      };
    },
  }),
  { debugName: 'PointTransactionUseCase' },
);

export type PointTransactionUseCase = InferInput<typeof pointTransactionUseCase>;
