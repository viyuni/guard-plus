import type { BiliEventPageQuery } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { Database } from '#composition/tokens';
import type { DbExecutor } from '#infrastructure/db';
import { QueryPageBuilder } from '#infrastructure/db/helper';
import {
  biliEvents,
  type BiliEventRewardItemSnapshot,
  type BiliEventRewardResultSnapshot,
  type BiliEventStatus,
  type InsertBiliEvent,
} from '#infrastructure/db/schema';

export const BiliEventRepo = ripple(
  {
    Database,
  },
  ({ Database }) => {
    async function updateStatus(
      biliEventId: string,
      input: {
        status: BiliEventStatus;
        userId?: string | null;
        rewardResultSnapshots?: BiliEventRewardResultSnapshot[];
        lastErrorCode?: string | null;
        lastErrorMessage?: string | null;
        processedAt?: Date | null;
      },
      executor: DbExecutor,
    ) {
      const [event] = await executor
        .update(biliEvents)
        .set(input)
        .where(eq(biliEvents.biliEventId, biliEventId))
        .returning();

      return event ?? null;
    }

    return {
      async findByBiliEventId(biliEventId: string, executor: DbExecutor = Database) {
        return await executor.query.biliEvents.findFirst({
          where: {
            biliEventId,
          },
        });
      },

      async listReplayableBiliGuardByBiliUid(biliUid: string, executor: DbExecutor = Database) {
        return await executor
          .select()
          .from(biliEvents)
          .where(
            and(
              eq(biliEvents.eventType, 'biliGuard'),
              eq(biliEvents.biliUid, biliUid),
              inArray(biliEvents.status, ['ignored', 'failed']),
            ),
          )
          .orderBy(asc(biliEvents.occurredAt), asc(biliEvents.createdAt));
      },

      pageBiliGuard(query: BiliEventPageQuery, executor: DbExecutor = Database) {
        return new QueryPageBuilder(executor, biliEvents, executor.query.biliEvents)
          .page(query.page)
          .pageSize(query.pageSize)
          .where({
            eventType: 'biliGuard',
            status: query.status,
            occurredAt: {
              gte: query.startAt ?? undefined,
              lte: query.endAt ?? undefined,
            },
            OR: query.keyword
              ? [
                  {
                    biliEventId: {
                      ilike: `%${query.keyword}%`,
                    },
                  },
                  {
                    biliUid: {
                      ilike: `%${query.keyword}%`,
                    },
                  },
                ]
              : [],
          })
          .query((findMany, { where, limit, offset }) =>
            findMany({
              where,
              limit,
              offset,
              with: {
                user: {
                  columns: {
                    biliUid: true,
                    username: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
                occurredAt: 'desc',
              },
            }),
          )
          .paginate();
      },

      async upsertProcessing(
        input: Pick<InsertBiliEvent, 'biliEventId' | 'biliUid' | 'occurredAt' | 'eventSnapshot'> & {
          rewardItemSnapshots: BiliEventRewardItemSnapshot[];
        },
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .insert(biliEvents)
          .values({
            ...input,
            status: 'processing',
            rewardResultSnapshots: [],
          })
          .onConflictDoNothing({
            target: biliEvents.biliEventId,
          })
          .returning();

        return event ?? null;
      },

      async markProcessing(biliEventId: string, executor: DbExecutor = Database) {
        return await updateStatus(
          biliEventId,
          {
            status: 'processing',
            lastErrorCode: null,
            lastErrorMessage: null,
            processedAt: null,
          },
          executor,
        );
      },

      async markIgnored(
        biliEventId: string,
        input: {
          lastErrorCode: string;
          lastErrorMessage: string;
        },
        executor: DbExecutor = Database,
      ) {
        return await updateStatus(
          biliEventId,
          {
            status: 'ignored',
            userId: null,
            rewardResultSnapshots: [],
            lastErrorCode: input.lastErrorCode,
            lastErrorMessage: input.lastErrorMessage,
            processedAt: new Date(),
          },
          executor,
        );
      },

      async markSucceeded(
        biliEventId: string,
        input: {
          userId: string;
          rewardResultSnapshots: BiliEventRewardResultSnapshot[];
        },
        executor: DbExecutor = Database,
      ) {
        return await updateStatus(
          biliEventId,
          {
            status: 'succeeded',
            userId: input.userId,
            rewardResultSnapshots: input.rewardResultSnapshots,
            lastErrorCode: null,
            lastErrorMessage: null,
            processedAt: new Date(),
          },
          executor,
        );
      },

      async markFailed(
        biliEventId: string,
        input: {
          lastErrorCode: string;
          lastErrorMessage: string;
        },
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .update(biliEvents)
          .set({
            status: 'failed',
            retryCount: sql`${biliEvents.retryCount} + 1`,
            lastErrorCode: input.lastErrorCode,
            lastErrorMessage: input.lastErrorMessage,
            processedAt: new Date(),
          })
          .where(eq(biliEvents.biliEventId, biliEventId))
          .returning();

        return event ?? null;
      },
    };
  },
  { debugName: 'BiliEventRepository' },
);

export type BiliEventRepository = InferInput<typeof BiliEventRepo>;
