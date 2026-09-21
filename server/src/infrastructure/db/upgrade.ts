import { and, eq, isNull, ne, sql } from 'drizzle-orm';

import type { DbClient } from './client';
import { biliEvents } from './schema';

/**
 * 将旧版事件记录升级为可租约抢占的任务数据。
 *
 * 条件刻意识别没有任何 claim 元数据的旧记录，因此可以在每次部署后幂等执行，
 * 也不会把正在处理的新任务误标记为已经生成奖励计划。
 */
export function upgradeBiliEventJobs(db: DbClient, now = new Date()) {
  return db.transaction(async tx => {
    const legacyEvent = and(
      ne(biliEvents.status, 'pending'),
      isNull(biliEvents.rewardPlanCreatedAt),
      isNull(biliEvents.claimedBy),
      isNull(biliEvents.claimedAt),
      isNull(biliEvents.leaseUntil),
    );

    const plannedEvents = await tx
      .update(biliEvents)
      .set({
        rewardPlanCreatedAt: sql`${biliEvents.createdAt}`,
      })
      .where(legacyEvent)
      .returning({ id: biliEvents.id });

    const interruptedEvents = await tx
      .update(biliEvents)
      .set({
        status: 'failed',
        nextRetryAt: now,
        lastErrorCode: sql`coalesce(${biliEvents.lastErrorCode}, 'WORKER_INTERRUPTED')`,
        lastErrorMessage: sql`coalesce(${biliEvents.lastErrorMessage}, '事件服务升级时恢复未完成任务')`,
        processedAt: now,
      })
      .where(
        and(
          eq(biliEvents.status, 'processing'),
          isNull(biliEvents.claimedBy),
          isNull(biliEvents.claimedAt),
          isNull(biliEvents.leaseUntil),
        ),
      )
      .returning({ id: biliEvents.id });

    return {
      planned: plannedEvents.length,
      recovered: interruptedEvents.length,
    };
  });
}
