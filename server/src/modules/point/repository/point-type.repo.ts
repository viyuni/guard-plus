import { type InferInput, ripple } from 'cyrenejs';
import { eq, sql } from 'drizzle-orm';

import { Database } from '#context/tokens';
import type { DbExecutor } from '#db';
import { pointTypes, type InsertPointType, type PointType, type UpdatePointType } from '#db/schema';

export const PointTypeRepo = ripple(
  {
    Database,
  },
  ({ Database }) => ({
    async findById(pointTypeId: string, executor: DbExecutor = Database) {
      return (
        (await executor.query.pointTypes.findFirst({
          where: {
            id: pointTypeId,
          },
        })) ?? null
      );
    },

    async findByName(name: string, executor: DbExecutor = Database) {
      return (
        (await executor.query.pointTypes.findFirst({
          where: {
            name,
          },
        })) ?? null
      );
    },

    async create(input: InsertPointType, executor: DbExecutor = Database) {
      const [row] = await executor.insert(pointTypes).values(input).returning();
      return row ?? null;
    },

    async update(pointTypeId: string, data: UpdatePointType, executor: DbExecutor = Database) {
      const [row] = await executor
        .update(pointTypes)
        .set(data)
        .where(eq(pointTypes.id, pointTypeId))
        .returning();

      return row ?? null;
    },

    async updateStatus(
      pointTypeId: string,
      status: PointType['status'],
      executor: DbExecutor = Database,
    ) {
      const [row] = await executor
        .update(pointTypes)
        .set({
          status,
        })
        .where(eq(pointTypes.id, pointTypeId))
        .returning();

      return row ?? null;
    },

    list() {
      return Database.query.pointTypes.findMany({
        orderBy: t => [sql`${t.sort} DESC NULLS FIRST`],
      });
    },
  }),
  { debugName: 'PointTypeRepository' },
);

export type PointTypeRepository = InferInput<typeof PointTypeRepo>;
