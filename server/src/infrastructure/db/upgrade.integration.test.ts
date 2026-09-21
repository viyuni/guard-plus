import { expect, it } from 'bun:test';

import { inArray } from 'drizzle-orm';

import {
  db,
  describeWithDatabase,
  installConcurrencyTestHooks,
  newBatch,
} from '#test-helpers/concurrency-fixtures';

import { biliEvents } from './schema';
import { upgradeBiliEventJobs } from './upgrade';

installConcurrencyTestHooks();

describeWithDatabase('database event job upgrade', () => {
  it('backfills only legacy events and schedules interrupted processing work', async () => {
    const prefix = newBatch('event_upgrade');
    const createdAt = new Date('2026-09-20T00:00:00.000Z');
    const upgradedAt = new Date('2026-09-21T00:00:00.000Z');

    const eventIds = {
      active: `${prefix}:active`,
      failed: `${prefix}:failed`,
      interrupted: `${prefix}:interrupted`,
      pending: `${prefix}:pending`,
    };

    await db.insert(biliEvents).values([
      createEvent(eventIds.pending, 'pending', createdAt),
      createEvent(eventIds.failed, 'failed', createdAt),
      createEvent(eventIds.interrupted, 'processing', createdAt),
      {
        ...createEvent(eventIds.active, 'processing', createdAt),
        claimedBy: 'active-worker',
        claimedAt: createdAt,
        leaseUntil: new Date('2026-09-21T00:01:00.000Z'),
      },
    ]);

    const first = await upgradeBiliEventJobs(db, upgradedAt);
    const second = await upgradeBiliEventJobs(db, upgradedAt);

    const events = await db
      .select()
      .from(biliEvents)
      .where(inArray(biliEvents.biliEventId, Object.values(eventIds)));

    const byId = Object.fromEntries(events.map(event => [event.biliEventId, event]));

    expect(first).toEqual({ planned: 2, recovered: 1 });
    expect(second).toEqual({ planned: 0, recovered: 0 });
    expect(byId[eventIds.pending]?.rewardPlanCreatedAt).toBeNull();
    expect(byId[eventIds.failed]).toMatchObject({
      status: 'failed',
      nextRetryAt: null,
      rewardPlanCreatedAt: createdAt,
    });
    expect(byId[eventIds.interrupted]).toMatchObject({
      status: 'failed',
      nextRetryAt: upgradedAt,
      rewardPlanCreatedAt: createdAt,
      lastErrorCode: 'WORKER_INTERRUPTED',
    });
    expect(byId[eventIds.active]).toMatchObject({
      status: 'processing',
      rewardPlanCreatedAt: null,
      claimedBy: 'active-worker',
    });
  });
});

function createEvent(
  biliEventId: string,
  status: 'failed' | 'pending' | 'processing',
  createdAt: Date,
) {
  return {
    biliEventId,
    biliUid: '721',
    occurredAt: createdAt,
    status,
    eventSnapshot: { id: biliEventId, uid: 721 },
    createdAt,
    updatedAt: createdAt,
  };
}
