import { and, eq } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import { deletedAtIsNull } from '#db/helper';
import {
  pointConversionRules,
  type InsertPointConversionRule,
  type UpdatePointConversionRule,
} from '#db/schema';

export class PointConversionRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(pointConversionRuleId: string, db: DbExecutor = this.db) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(
        and(
          eq(pointConversionRules.id, pointConversionRuleId),
          deletedAtIsNull(pointConversionRules),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findByName(name: string, db: DbExecutor = this.db) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(and(eq(pointConversionRules.name, name), deletedAtIsNull(pointConversionRules)))
      .limit(1);

    return row ?? null;
  }

  async findByPointTypePair(
    input: { fromPointTypeId: string; toPointTypeId: string },
    db: DbExecutor = this.db,
  ) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(
        and(
          eq(pointConversionRules.fromPointTypeId, input.fromPointTypeId),
          eq(pointConversionRules.toPointTypeId, input.toPointTypeId),
          deletedAtIsNull(pointConversionRules),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(input: InsertPointConversionRule, db: DbExecutor = this.db) {
    const [row] = await db.insert(pointConversionRules).values(input).returning();
    return row ?? null;
  }

  async update(
    pointConversionRuleId: string,
    data: UpdatePointConversionRule,
    db: DbExecutor = this.db,
  ) {
    const [row] = await db
      .update(pointConversionRules)
      .set(data)
      .where(
        and(
          eq(pointConversionRules.id, pointConversionRuleId),
          deletedAtIsNull(pointConversionRules),
        ),
      )
      .returning();

    return row ?? null;
  }

  async enabled(pointConversionRuleId: string, db: DbExecutor = this.db) {
    return this.update(pointConversionRuleId, { enabled: true }, db);
  }

  async disabled(pointConversionRuleId: string, db: DbExecutor = this.db) {
    return this.update(pointConversionRuleId, { enabled: false }, db);
  }

  async delete(pointConversionRuleId: string, db: DbExecutor = this.db) {
    return this.update(pointConversionRuleId, { deletedAt: new Date() }, db);
  }

  listManage(db: DbExecutor = this.db) {
    return db.query.pointConversionRules.findMany({
      where: {
        deletedAt: {
          isNull: true,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      with: {
        fromPointType: true,
        toPointType: true,
      },
    });
  }

  listVisible(db: DbExecutor = this.db) {
    const now = new Date();

    return db.query.pointConversionRules.findMany({
      columns: {
        id: true,
        name: true,
        description: true,
        // fromPointTypeId: true,
        // toPointTypeId: true,
        toAmount: true,
        minConvertAmount: true,
        maxConvertAmount: true,
      },
      where: {
        deletedAt: {
          isNull: true,
        },
        enabled: true,
        AND: [
          {
            OR: [{ startAt: { isNull: true } }, { startAt: { lte: now } }],
          },
          {
            OR: [{ endAt: { isNull: true } }, { endAt: { gt: now } }],
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      with: {
        fromPointType: {
          columns: {
            id: true,
            name: true,
            icon: true,
          },
        },
        toPointType: {
          columns: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });
  }
}
