import { type InferInput, ripple } from 'cyrenejs';
import { and, eq } from 'drizzle-orm';

import { Database } from '#context/tokens';
import type { DbExecutor } from '#db';
import { deletedAtIsNull } from '#db/helper';
import {
  pointConversionRules,
  type InsertPointConversionRule,
  type UpdatePointConversionRule,
} from '#db/schema';

export const PointConversionRuleRepo = ripple(
  {
    Database,
  },
  ({ Database }) => {
    async function update(
      pointConversionRuleId: string,
      data: UpdatePointConversionRule,
      executor: DbExecutor = Database,
    ) {
      const [row] = await executor
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

    return {
      async findById(pointConversionRuleId: string, executor: DbExecutor = Database) {
        const [row] = await executor
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
      },

      async findByName(name: string, executor: DbExecutor = Database) {
        const [row] = await executor
          .select()
          .from(pointConversionRules)
          .where(and(eq(pointConversionRules.name, name), deletedAtIsNull(pointConversionRules)))
          .limit(1);

        return row ?? null;
      },

      async findByPointTypePair(
        input: { fromPointTypeId: string; toPointTypeId: string },
        executor: DbExecutor = Database,
      ) {
        const [row] = await executor
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
      },

      async create(input: InsertPointConversionRule, executor: DbExecutor = Database) {
        const [row] = await executor.insert(pointConversionRules).values(input).returning();
        return row ?? null;
      },

      update,

      async enabled(pointConversionRuleId: string, executor: DbExecutor = Database) {
        return update(pointConversionRuleId, { enabled: true }, executor);
      },

      async disabled(pointConversionRuleId: string, executor: DbExecutor = Database) {
        return update(pointConversionRuleId, { enabled: false }, executor);
      },

      async delete(pointConversionRuleId: string, executor: DbExecutor = Database) {
        return update(pointConversionRuleId, { deletedAt: new Date() }, executor);
      },

      listManage(executor: DbExecutor = Database) {
        return executor.query.pointConversionRules.findMany({
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
      },

      listVisible(executor: DbExecutor = Database) {
        const now = new Date();

        return executor.query.pointConversionRules.findMany({
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
      },
    };
  },
  { debugName: 'PointConversionRuleRepository' },
);

export type PointConversionRuleRepository = InferInput<typeof PointConversionRuleRepo>;
