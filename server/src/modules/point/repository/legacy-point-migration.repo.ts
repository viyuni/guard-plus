import type { LegacyPointMigrationPageQuery } from '@shared/schema/point-account';
import { type InferInput, ripple } from 'cyrenejs';
import { and, eq, isNull } from 'drizzle-orm';

import { Database } from '#context/tokens';
import type { DbExecutor, DbTransaction } from '#db';
import { QueryPageBuilder } from '#db/helper';
import { legacyPointMigrations, type InsertLegacyPointMigration } from '#db/schema';

type ReplayedAtFilter = { isNull: true } | { isNotNull: true } | undefined;

function resolveReplayedAtFilter(
  status: LegacyPointMigrationPageQuery['status'],
): ReplayedAtFilter {
  if (status === 'pending') {
    return { isNull: true };
  }

  if (status === 'replayed') {
    return { isNotNull: true };
  }

  return undefined;
}

export const legacyPointMigrationRepo = ripple(
  {
    db: Database,
  },
  ({ db }) => ({
    async create(input: InsertLegacyPointMigration, executor: DbExecutor = db) {
      const [row] = await executor.insert(legacyPointMigrations).values(input).returning();
      return row ?? null;
    },

    page(query: LegacyPointMigrationPageQuery) {
      return new QueryPageBuilder(db, legacyPointMigrations, db.query.legacyPointMigrations)
        .where({
          biliUid: query.biliUid,
          pointTypeId: query.pointTypeId,
          replayedAt: resolveReplayedAtFilter(query.status),
        })
        .query((findMany, { where, limit, offset }) =>
          findMany({
            where,
            limit,
            offset,
            with: { pointType: { columns: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          }),
        )
        .page(query.page)
        .pageSize(query.pageSize)
        .paginate();
    },

    async listPendingForUpdate(tx: DbTransaction, biliUid: string) {
      return tx
        .select()
        .from(legacyPointMigrations)
        .where(
          and(eq(legacyPointMigrations.biliUid, biliUid), isNull(legacyPointMigrations.replayedAt)),
        )
        .orderBy(legacyPointMigrations.createdAt, legacyPointMigrations.id)
        .for('update');
    },

    async findPendingByIdForUpdate(tx: DbTransaction, migrationId: string) {
      const [row] = await tx
        .select()
        .from(legacyPointMigrations)
        .where(
          and(eq(legacyPointMigrations.id, migrationId), isNull(legacyPointMigrations.replayedAt)),
        )
        .for('update');

      return row ?? null;
    },

    async markReplayed(tx: DbTransaction, migrationId: string, userId: string) {
      const [row] = await tx
        .update(legacyPointMigrations)
        .set({ replayedAt: new Date(), replayedUserId: userId })
        .where(
          and(eq(legacyPointMigrations.id, migrationId), isNull(legacyPointMigrations.replayedAt)),
        )
        .returning();

      return row ?? null;
    },

    async deletePending(migrationId: string, executor: DbExecutor = db) {
      const [row] = await executor
        .delete(legacyPointMigrations)
        .where(
          and(eq(legacyPointMigrations.id, migrationId), isNull(legacyPointMigrations.replayedAt)),
        )
        .returning();

      return row ?? null;
    },
  }),
  { debugName: 'LegacyPointMigrationRepository' },
);

export type LegacyPointMigrationRepository = InferInput<typeof legacyPointMigrationRepo>;
