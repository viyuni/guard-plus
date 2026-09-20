import { type InferInput, ripple } from 'cyrenejs';
import { and, asc, eq, gt, isNull, lte, or } from 'drizzle-orm';

import { Database } from '#context/tokens';
import type { DbExecutor } from '#db';
import { deletedAtIsNull } from '#db/helper';
import {
  rewardRules,
  type InsertRewardRule,
  type RewardRule,
  type UpdateRewardRule,
} from '#db/schema';

export const RewardRuleRepo = ripple(
  {
    Database,
  },
  ({ Database }) => {
    async function update(
      rewardRuleId: string,
      data: UpdateRewardRule,
      executor: DbExecutor = Database,
    ) {
      const [rule] = await executor
        .update(rewardRules)
        .set(data)
        .where(and(eq(rewardRules.id, rewardRuleId), deletedAtIsNull(rewardRules)))
        .returning();

      return rule ?? null;
    }

    return {
      async findById(rewardRuleId: string, executor: DbExecutor = Database) {
        return await executor.query.rewardRules.findFirst({
          where: {
            id: rewardRuleId,
            deletedAt: {
              isNull: true,
            },
          },
        });
      },

      async findByName(name: string, executor: DbExecutor = Database) {
        return (
          (await executor.query.rewardRules.findFirst({
            where: {
              name,
              deletedAt: {
                isNull: true,
              },
            },
          })) ?? null
        );
      },

      async listCandidates(now = new Date(), executor: DbExecutor = Database) {
        const startedAt = or(isNull(rewardRules.startAt), lte(rewardRules.startAt, now));
        const notEndedAt = or(isNull(rewardRules.endAt), gt(rewardRules.endAt, now));

        return await executor
          .select()
          .from(rewardRules)
          .where(
            and(deletedAtIsNull(rewardRules), eq(rewardRules.enabled, true), startedAt, notEndedAt),
          )
          .orderBy(asc(rewardRules.priority), asc(rewardRules.createdAt));
      },

      async create(input: InsertRewardRule, executor: DbExecutor = Database) {
        const [rule] = await executor.insert(rewardRules).values(input).returning();
        return rule ?? null;
      },

      update,

      async delete(rewardRuleId: string, executor: DbExecutor = Database) {
        const [rule] = await executor
          .update(rewardRules)
          .set({
            deletedAt: new Date(),
          })
          .where(and(eq(rewardRules.id, rewardRuleId), deletedAtIsNull(rewardRules)))
          .returning();

        return rule ?? null;
      },

      async updateEnabled(
        rewardRuleId: string,
        enabled: RewardRule['enabled'],
        executor: DbExecutor = Database,
      ) {
        return await update(rewardRuleId, { enabled }, executor);
      },

      listManage() {
        return Database.query.rewardRules.findMany({
          where: {
            deletedAt: {
              isNull: true,
            },
          },
          with: {
            pointType: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: {
            priority: 'desc',
            createdAt: 'desc',
          },
        });
      },

      listVisible() {
        const now = new Date();

        return Database.query.rewardRules.findMany({
          where: {
            AND: [
              {
                deletedAt: {
                  isNull: true,
                },
              },
              {
                enabled: true,
              },
              {
                startAt: {
                  isNull: true,
                  or: [
                    {
                      lte: now,
                    },
                  ],
                },
                endAt: {
                  isNull: true,
                  or: [
                    {
                      gte: now,
                    },
                  ],
                },
              },
            ],
          },
          columns: {
            name: true,
            description: true,
          },
          with: {
            pointType: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: {
            priority: 'desc',
            createdAt: 'desc',
          },
        });
      },
    };
  },
  { debugName: 'RewardRuleRepository' },
);

export type RewardRuleRepository = InferInput<typeof RewardRuleRepo>;
