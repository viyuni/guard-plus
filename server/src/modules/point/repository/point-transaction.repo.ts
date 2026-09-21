import type { PointTransactionPageQuery } from '@shared/schema/point-transaction';
import { type InferInput, ripple } from 'cyrenejs';
import { eq } from 'drizzle-orm';

import { Database } from '#composition/tokens';
import type { DbExecutor, DbTransaction } from '#infrastructure/db';
import { QueryPageBuilder } from '#infrastructure/db/helper';
import { pointTransactions, type InsertPointTransaction } from '#infrastructure/db/schema';

import { PointTransactionNotFoundError } from '../domain';

export const PointTransactionRepo = ripple(
  {
    Database,
  },
  ({ Database }) => ({
    async requireByIdForUpdate(tx: DbTransaction, transactionId: string) {
      const [transaction] = await tx
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.id, transactionId))
        .for('update');

      if (!transaction) {
        throw new PointTransactionNotFoundError();
      }

      return transaction;
    },

    async findByAccountAndIdempotencyKey(
      input: { accountId: string; idempotencyKey: string },
      executor: DbExecutor = Database,
    ) {
      return await executor.query.pointTransactions.findFirst({
        where: {
          pointAccountId: input.accountId,
          idempotencyKey: input.idempotencyKey,
        },
      });
    },

    async findReversalByOriginalTransactionId(
      transactionId: string,
      executor: DbExecutor = Database,
    ) {
      return await executor.query.pointTransactions.findFirst({
        where: {
          reversalOfTransactionId: transactionId,
        },
      });
    },

    async create(tx: DbTransaction, input: InsertPointTransaction) {
      const [transaction] = await tx.insert(pointTransactions).values(input).returning();

      return transaction ?? null;
    },

    pageManage(query: PointTransactionPageQuery) {
      return new QueryPageBuilder(Database, pointTransactions, Database.query.pointTransactions)
        .pageSize(query.pageSize)
        .page(query.page)
        .where({
          userId: query.userId,
          type: query.type,
          pointTypeId: query.pointTypeId,
          createdAt: {
            gte: query.startAt ?? undefined,
            lte: query.endAt ?? undefined,
          },
        })
        .query((findMany, { where, limit, offset }) =>
          findMany({
            where,
            limit,
            offset,
            orderBy: {
              createdAt: 'desc',
            },
            with: {
              user: {
                columns: {
                  username: true,
                  biliUid: true,
                },
              },

              reversal: {
                columns: {
                  id: true,
                },
              },
            },
          }),
        )
        .paginate();
    },

    pageMine(query: PointTransactionPageQuery) {
      return new QueryPageBuilder(Database, pointTransactions, Database.query.pointTransactions)
        .pageSize(query.pageSize)
        .page(query.page)
        .where({
          userId: query.userId,
          type: query.type,
          pointTypeId: query.pointTypeId,
          createdAt: {
            gte: query.startAt ?? undefined,
            lte: query.endAt ?? undefined,
          },
        })
        .query((findMany, { where, limit, offset }) =>
          findMany({
            where,
            limit,
            offset,
            columns: {
              id: true,
              pointTypeNameSnapshot: true,
              type: true,
              delta: true,
              balanceBefore: true,
              balanceAfter: true,
              sourceType: true,
              remark: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),
        )
        .paginate();
    },
  }),
  { debugName: 'PointTransactionRepository' },
);

export type PointTransactionRepository = InferInput<typeof PointTransactionRepo>;
