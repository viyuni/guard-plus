import { and, asc, eq, gt, isNull, lte, or } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import { deletedAtIsNull } from '#db/helper';
import {
  rewardRules,
  type InsertRewardRule,
  type RewardRule,
  type UpdateRewardRule,
} from '#db/schema';

export class RewardRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(rewardRuleId: string, db: DbExecutor = this.db) {
    return await db.query.rewardRules.findFirst({
      where: {
        id: rewardRuleId,
        deletedAt: {
          isNull: true,
        },
      },
    });
  }

  async findByName(name: string, db: DbExecutor = this.db) {
    return (
      (await db.query.rewardRules.findFirst({
        where: {
          name,
          deletedAt: {
            isNull: true,
          },
        },
      })) ?? null
    );
  }

  async listCandidates(now = new Date(), db: DbExecutor = this.db) {
    return await db
      .select()
      .from(rewardRules)
      .where(
        and(
          deletedAtIsNull(rewardRules),
          eq(rewardRules.enabled, true),
          or(isNull(rewardRules.startAt), lte(rewardRules.startAt, now)),
          or(isNull(rewardRules.endAt), gt(rewardRules.endAt, now)),
        ),
      )
      .orderBy(asc(rewardRules.priority), asc(rewardRules.createdAt));
  }

  async create(input: InsertRewardRule, db: DbExecutor = this.db) {
    const [rule] = await db.insert(rewardRules).values(input).returning();
    return rule ?? null;
  }

  async update(rewardRuleId: string, data: UpdateRewardRule, db: DbExecutor = this.db) {
    const [rule] = await db
      .update(rewardRules)
      .set(data)
      .where(and(eq(rewardRules.id, rewardRuleId), deletedAtIsNull(rewardRules)))
      .returning();

    return rule ?? null;
  }

  async delete(rewardRuleId: string, db: DbExecutor = this.db) {
    const [rule] = await db
      .update(rewardRules)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(rewardRules.id, rewardRuleId), deletedAtIsNull(rewardRules)))
      .returning();

    return rule ?? null;
  }

  async updateEnabled(
    rewardRuleId: string,
    enabled: RewardRule['enabled'],
    db: DbExecutor = this.db,
  ) {
    return await this.update(rewardRuleId, { enabled }, db);
  }

  listManage() {
    return this.db.query.rewardRules.findMany({
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
  }

  listVisible() {
    const now = new Date();

    return this.db.query.rewardRules.findMany({
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
  }
}
