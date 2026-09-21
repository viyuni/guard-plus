import { expect, it } from 'bun:test';

import { biliEvents } from '#infrastructure/db/schema';
import {
  createBiliGuardEvent,
  createDeps,
  db,
  describeWithDatabase,
  installConcurrencyTestHooks,
  newBatch,
} from '#test-helpers/concurrency-fixtures';

installConcurrencyTestHooks();

describeWithDatabase('BiliEventRepository task claims', () => {
  it('allows only one worker to claim a pending event', async () => {
    const prefix = newBatch('bili_event_claim');
    const event = createBiliGuardEvent(prefix, 721);
    const { BiliEventRepo } = await createDeps();
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 60_000);

    await BiliEventRepo.enqueueBiliGuard({
      biliEventId: event.id,
      biliUid: String(event.uid),
      occurredAt: now,
      eventSnapshot: event,
    });

    const claims = await Promise.all([
      BiliEventRepo.claimNextBiliGuard({
        claimId: `${prefix}:worker-1`,
        now,
        leaseUntil,
        maxRetries: 5,
      }),
      BiliEventRepo.claimNextBiliGuard({
        claimId: `${prefix}:worker-2`,
        now,
        leaseUntil,
        maxRetries: 5,
      }),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(claims.find(Boolean)?.biliEventId).toBe(event.id);
  });

  it('reclaims an event after its worker lease expires', async () => {
    const prefix = newBatch('bili_event_reclaim');
    const event = createBiliGuardEvent(prefix, 722);
    const { BiliEventRepo } = await createDeps();
    const claimedAt = new Date();

    await BiliEventRepo.enqueueBiliGuard({
      biliEventId: event.id,
      biliUid: String(event.uid),
      occurredAt: claimedAt,
      eventSnapshot: event,
    });

    const first = await BiliEventRepo.claimNextBiliGuard({
      claimId: `${prefix}:worker-1`,
      now: claimedAt,
      leaseUntil: new Date(claimedAt.getTime() + 1_000),
      maxRetries: 5,
    });

    const reclaimedAt = new Date(claimedAt.getTime() + 2_000);

    const second = await BiliEventRepo.claimNextBiliGuard({
      claimId: `${prefix}:worker-2`,
      now: reclaimedAt,
      leaseUntil: new Date(reclaimedAt.getTime() + 60_000),
      maxRetries: 5,
    });

    expect(first?.biliEventId).toBe(event.id);
    expect(second).toMatchObject({
      biliEventId: event.id,
      claimedBy: `${prefix}:worker-2`,
      status: 'processing',
    });
  });

  it('does not claim unscheduled failures or synchronous processing work', async () => {
    const prefix = newBatch('bili_event_excluded');
    const failed = createBiliGuardEvent(`${prefix}:failed`, 723);
    const synchronous = createBiliGuardEvent(`${prefix}:synchronous`, 724);
    const { BiliEventRepo } = await createDeps();
    const now = new Date();

    await db.insert(biliEvents).values([
      {
        biliEventId: failed.id,
        biliUid: String(failed.uid),
        occurredAt: now,
        status: 'failed',
        eventSnapshot: failed,
      },
      {
        biliEventId: synchronous.id,
        biliUid: String(synchronous.uid),
        occurredAt: now,
        status: 'processing',
        eventSnapshot: synchronous,
        rewardPlanCreatedAt: now,
      },
    ]);

    const claimed = await BiliEventRepo.claimNextBiliGuard({
      claimId: `${prefix}:worker`,
      now,
      leaseUntil: new Date(now.getTime() + 60_000),
      maxRetries: 5,
    });

    expect(claimed).toBeNull();
  });
});
