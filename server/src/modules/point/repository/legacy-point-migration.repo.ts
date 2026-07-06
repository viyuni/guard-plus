import type { LegacyPointMigrationPageQuery } from '@shared/schema/point-account';
import { and, eq, isNull } from 'drizzle-orm';

import type { DbExecutor, DbTransaction } from '#db';
import { QueryPageBuilder } from '#db/helper';
import { legacyPointMigrations, type InsertLegacyPointMigration } from '#db/schema';

export class LegacyPointMigrationRepository {
  constructor(private readonly db: DbExecutor) {}

  async create(input: InsertLegacyPointMigration, db: DbExecutor = this.db) {
    const [row] = await db.insert(legacyPointMigrations).values(input).returning();
    return row ?? null;
  }

  page(query: LegacyPointMigrationPageQuery) {
    return new QueryPageBuilder(this.db, legacyPointMigrations, this.db.query.legacyPointMigrations)
      .where({
        biliUid: query.biliUid,
        pointTypeId: query.pointTypeId,
        replayedAt:
          query.status === 'pending'
            ? { isNull: true }
            : query.status === 'replayed'
              ? { isNotNull: true }
              : undefined,
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
  }

  async listPendingForUpdate(tx: DbTransaction, biliUid: string) {
    return tx
      .select()
      .from(legacyPointMigrations)
      .where(
        and(eq(legacyPointMigrations.biliUid, biliUid), isNull(legacyPointMigrations.replayedAt)),
      )
      .orderBy(legacyPointMigrations.createdAt, legacyPointMigrations.id)
      .for('update');
  }

  async markReplayed(tx: DbTransaction, migrationId: string, userId: string) {
    const [row] = await tx
      .update(legacyPointMigrations)
      .set({ replayedAt: new Date(), replayedUserId: userId })
      .where(
        and(eq(legacyPointMigrations.id, migrationId), isNull(legacyPointMigrations.replayedAt)),
      )
      .returning();
    return row ?? null;
  }

  async deletePending(migrationId: string, db: DbExecutor = this.db) {
    const [row] = await db
      .delete(legacyPointMigrations)
      .where(
        and(eq(legacyPointMigrations.id, migrationId), isNull(legacyPointMigrations.replayedAt)),
      )
      .returning();
    return row ?? null;
  }
}
