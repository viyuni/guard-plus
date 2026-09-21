import type { BiliEventPageQuery } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';
import { and, asc, eq, inArray, isNotNull, lt, lte, or, sql } from 'drizzle-orm';

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
        claimedBy?: string | null;
        claimedAt?: Date | null;
        leaseUntil?: Date | null;
        nextRetryAt?: Date | null;
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
      async enqueueBiliGuard(
        input: Pick<InsertBiliEvent, 'biliEventId' | 'biliUid' | 'occurredAt' | 'eventSnapshot'>,
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .insert(biliEvents)
          .values({
            ...input,
            status: 'pending',
          })
          .onConflictDoNothing({
            target: biliEvents.biliEventId,
          })
          .returning();

        return event ?? null;
      },

      async claimNextBiliGuard(input: {
        claimId: string;
        leaseUntil: Date;
        maxRetries: number;
        now: Date;
      }) {
        return Database.transaction(async tx => {
          const retryIsDue = and(
            isNotNull(biliEvents.nextRetryAt),
            lte(biliEvents.nextRetryAt, input.now),
          );

          const failedCanRetry = and(
            eq(biliEvents.status, 'failed'),
            lt(biliEvents.retryCount, input.maxRetries),
            retryIsDue,
          );

          const leaseExpired = and(
            isNotNull(biliEvents.leaseUntil),
            lte(biliEvents.leaseUntil, input.now),
          );

          const interrupted = and(eq(biliEvents.status, 'processing'), leaseExpired);
          const claimable = or(eq(biliEvents.status, 'pending'), failedCanRetry, interrupted);

          const [candidate] = await tx
            .select({ id: biliEvents.id })
            .from(biliEvents)
            .where(and(eq(biliEvents.eventType, 'biliGuard'), claimable))
            .orderBy(asc(biliEvents.createdAt))
            .limit(1)
            .for('update', { skipLocked: true });

          if (!candidate) {
            return null;
          }

          const [claimed] = await tx
            .update(biliEvents)
            .set({
              status: 'processing',
              claimedBy: input.claimId,
              claimedAt: input.now,
              leaseUntil: input.leaseUntil,
              nextRetryAt: null,
              processedAt: null,
            })
            .where(eq(biliEvents.id, candidate.id))
            .returning();

          return claimed ?? null;
        });
      },

      async saveClaimedRewardPlan(
        biliEventId: string,
        claimId: string,
        rewardItemSnapshots: BiliEventRewardItemSnapshot[],
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .update(biliEvents)
          .set({
            rewardItemSnapshots,
            rewardPlanCreatedAt: new Date(),
          })
          .where(
            and(
              eq(biliEvents.biliEventId, biliEventId),
              eq(biliEvents.status, 'processing'),
              eq(biliEvents.claimedBy, claimId),
            ),
          )
          .returning();

        return event ?? null;
      },

      async renewClaim(
        biliEventId: string,
        claimId: string,
        leaseUntil: Date,
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .update(biliEvents)
          .set({ leaseUntil })
          .where(
            and(
              eq(biliEvents.biliEventId, biliEventId),
              eq(biliEvents.status, 'processing'),
              eq(biliEvents.claimedBy, claimId),
            ),
          )
          .returning({ id: biliEvents.id });

        return event !== undefined;
      },

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
            rewardPlanCreatedAt: new Date(),
            rewardResultSnapshots: [],
          })
          .onConflictDoNothing({
            target: biliEvents.biliEventId,
          })
          .returning();

        return event ?? null;
      },

      async markProcessing(biliEventId: string, executor: DbExecutor = Database) {
        const [event] = await executor
          .update(biliEvents)
          .set({
            status: 'processing',
            lastErrorCode: null,
            lastErrorMessage: null,
            processedAt: null,
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
            nextRetryAt: null,
          })
          .where(
            and(
              eq(biliEvents.biliEventId, biliEventId),
              inArray(biliEvents.status, ['failed', 'ignored']),
            ),
          )
          .returning();

        return event ?? null;
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
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
            nextRetryAt: null,
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
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
            nextRetryAt: null,
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
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
          })
          .where(eq(biliEvents.biliEventId, biliEventId))
          .returning();

        return event ?? null;
      },

      async markClaimSucceeded(
        biliEventId: string,
        claimId: string,
        input: {
          userId: string;
          rewardResultSnapshots: BiliEventRewardResultSnapshot[];
        },
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .update(biliEvents)
          .set({
            status: 'succeeded',
            userId: input.userId,
            rewardResultSnapshots: input.rewardResultSnapshots,
            lastErrorCode: null,
            lastErrorMessage: null,
            processedAt: new Date(),
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
            nextRetryAt: null,
          })
          .where(
            and(
              eq(biliEvents.biliEventId, biliEventId),
              eq(biliEvents.status, 'processing'),
              eq(biliEvents.claimedBy, claimId),
            ),
          )
          .returning();

        return event ?? null;
      },

      async markClaimIgnored(
        biliEventId: string,
        claimId: string,
        input: { lastErrorCode: string; lastErrorMessage: string },
        executor: DbExecutor = Database,
      ) {
        const [event] = await executor
          .update(biliEvents)
          .set({
            status: 'ignored',
            userId: null,
            rewardResultSnapshots: [],
            lastErrorCode: input.lastErrorCode,
            lastErrorMessage: input.lastErrorMessage,
            processedAt: new Date(),
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
            nextRetryAt: null,
          })
          .where(
            and(
              eq(biliEvents.biliEventId, biliEventId),
              eq(biliEvents.status, 'processing'),
              eq(biliEvents.claimedBy, claimId),
            ),
          )
          .returning();

        return event ?? null;
      },

      async markClaimFailed(
        biliEventId: string,
        claimId: string,
        input: {
          lastErrorCode: string;
          lastErrorMessage: string;
          nextRetryAt: Date;
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
            claimedBy: null,
            claimedAt: null,
            leaseUntil: null,
            nextRetryAt: input.nextRetryAt,
          })
          .where(
            and(
              eq(biliEvents.biliEventId, biliEventId),
              eq(biliEvents.status, 'processing'),
              eq(biliEvents.claimedBy, claimId),
            ),
          )
          .returning();

        return event ?? null;
      },
    };
  },
  { debugName: 'BiliEventRepository' },
);

export type BiliEventRepository = InferInput<typeof BiliEventRepo>;
