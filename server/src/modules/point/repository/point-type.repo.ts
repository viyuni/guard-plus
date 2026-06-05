import { eq, sql } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import { pointTypes, type InsertPointType, type PointType, type UpdatePointType } from '#db/schema';

export class PointTypeRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(pointTypeId: string, db: DbExecutor = this.db) {
    return (
      (await db.query.pointTypes.findFirst({
        where: {
          id: pointTypeId,
        },
      })) ?? null
    );
  }

  async findByName(name: string, db: DbExecutor = this.db) {
    return (
      (await db.query.pointTypes.findFirst({
        where: {
          name,
        },
      })) ?? null
    );
  }

  async create(input: InsertPointType, db: DbExecutor = this.db) {
    const [row] = await db.insert(pointTypes).values(input).returning();
    return row ?? null;
  }

  async update(pointTypeId: string, data: UpdatePointType, db: DbExecutor = this.db) {
    const [row] = await db
      .update(pointTypes)
      .set(data)
      .where(eq(pointTypes.id, pointTypeId))
      .returning();

    return row ?? null;
  }

  async updateStatus(pointTypeId: string, status: PointType['status'], db: DbExecutor = this.db) {
    const [row] = await db
      .update(pointTypes)
      .set({
        status,
      })
      .where(eq(pointTypes.id, pointTypeId))
      .returning();

    return row ?? null;
  }

  list() {
    return this.db.query.pointTypes.findMany({
      orderBy: t => [sql`${t.sort} DESC NULLS FIRST`],
    });
  }
}
