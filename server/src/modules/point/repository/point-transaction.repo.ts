import type { PointTransactionPageQuery } from '@shared/schema/point-transaction';
import { eq } from 'drizzle-orm';

import type { DbExecutor, DbTransaction } from '#db';
import { QueryPageBuilder } from '#db/helper';
import { pointTransactions, type InsertPointTransaction } from '#db/schema';

import { PointTransactionNotFoundError } from '../domain';

export class PointTransactionRepository {
  constructor(private readonly db: DbExecutor) {}

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
  }

  async findByAccountAndIdempotencyKey(
    input: { accountId: string; idempotencyKey: string },
    db: DbExecutor = this.db,
  ) {
    return await db.query.pointTransactions.findFirst({
      where: {
        pointAccountId: input.accountId,
        idempotencyKey: input.idempotencyKey,
      },
    });
  }

  async findReversalByOriginalTransactionId(transactionId: string, db: DbExecutor = this.db) {
    return await db.query.pointTransactions.findFirst({
      where: {
        reversalOfTransactionId: transactionId,
      },
    });
  }

  async create(tx: DbTransaction, input: InsertPointTransaction) {
    const [transaction] = await tx.insert(pointTransactions).values(input).returning();

    return transaction ?? null;
  }

  pageManage(query: PointTransactionPageQuery) {
    return new QueryPageBuilder(this.db, pointTransactions, this.db.query.pointTransactions)
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
  }

  pageMine(query: PointTransactionPageQuery) {
    return new QueryPageBuilder(this.db, pointTransactions, this.db.query.pointTransactions)
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
  }
}
