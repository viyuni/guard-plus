import { describe, expect, mock, test } from 'bun:test';

import type { BiliEvent, BiliEventRewardItemSnapshot } from '#infrastructure/db/schema';
import type { AppLogger } from '#infrastructure/logger';
import type { BiliEventRepository } from '#modules/bili-event';
import type { BiliGuardRewardEvent, RewardProcessorService } from '#modules/reward';

import type { BiliGuardWorkerOptions } from '../config';
import { BiliGuardWorker } from './bili-guard.worker';

const options: BiliGuardWorkerOptions = {
  concurrency: 1,
  leaseMs: 60_000,
  maxRetries: 5,
  pollIntervalMs: 1_000,
  retryBaseDelayMs: 1_000,
  retryMaxDelayMs: 60_000,
};

const eventSnapshot = {
  id: 'guard-event-1',
  uid: 721,
} as BiliGuardRewardEvent;

function createEvent(input: Partial<BiliEvent> = {}): BiliEvent {
  const now = new Date('2026-09-21T00:00:00.000Z');

  return {
    id: '00000000-0000-4000-8000-000000000001',
    biliEventId: eventSnapshot.id,
    eventType: 'biliGuard',
    biliUid: String(eventSnapshot.uid),
    userId: null,
    occurredAt: now,
    status: 'processing',
    retryCount: 0,
    claimedBy: 'claim',
    claimedAt: now,
    leaseUntil: new Date(now.getTime() + options.leaseMs),
    nextRetryAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    processedAt: null,
    eventSnapshot,
    rewardPlanCreatedAt: null,
    rewardItemSnapshots: [],
    rewardResultSnapshots: [],
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

function createLogger() {
  return {
    debug: mock(() => undefined),
    error: mock(() => undefined),
    info: mock(() => undefined),
    warn: mock(() => undefined),
  } as unknown as AppLogger;
}

describe('BiliGuardWorker', () => {
  test('persists a reward plan before processing and completing a claim', async () => {
    const event = createEvent();
    const rewardItems: BiliEventRewardItemSnapshot[] = [];
    const claimNextBiliGuard = mock(() => Promise.resolve(event));

    const saveClaimedRewardPlan = mock(() =>
      Promise.resolve(createEvent({ rewardPlanCreatedAt: new Date(), rewardItemSnapshots: [] })),
    );

    const markClaimSucceeded = mock(() => Promise.resolve(createEvent({ status: 'succeeded' })));
    const previewBiliGuard = mock(() => Promise.resolve(rewardItems));

    const processBiliGuard = mock(() =>
      Promise.resolve({
        event: eventSnapshot,
        user: { id: '00000000-0000-4000-8000-000000000002' },
        ignored: false as const,
        ignoreReason: null,
        items: [],
        rewardResultSnapshots: [],
      }),
    );

    const worker = new BiliGuardWorker(
      {
        biliEventRepo: {
          claimNextBiliGuard,
          markClaimSucceeded,
          renewClaim: mock(() => Promise.resolve(true)),
          saveClaimedRewardPlan,
        } as unknown as BiliEventRepository,
        logger: createLogger(),
        rewardProcessor: {
          previewBiliGuard,
          processBiliGuard,
        } as unknown as RewardProcessorService,
      },
      options,
    );

    expect(await worker.runOnce()).toBe(true);
    expect(previewBiliGuard).toHaveBeenCalledWith(eventSnapshot);
    expect(saveClaimedRewardPlan).toHaveBeenCalledTimes(1);
    expect(processBiliGuard).toHaveBeenCalledWith(eventSnapshot, rewardItems);
    expect(markClaimSucceeded).toHaveBeenCalledTimes(1);
  });

  test('reuses the saved reward plan and schedules a retry after failure', async () => {
    const rewardItems: BiliEventRewardItemSnapshot[] = [];

    const event = createEvent({
      rewardPlanCreatedAt: new Date('2026-09-21T00:00:00.000Z'),
      rewardItemSnapshots: rewardItems,
      retryCount: 2,
    });

    const markClaimFailed = mock(
      (
        _biliEventId: string,
        _claimId: string,
        _input: {
          lastErrorCode: string;
          lastErrorMessage: string;
          nextRetryAt: Date;
        },
      ) => Promise.resolve(createEvent({ status: 'failed' })),
    );

    const previewBiliGuard = mock(() => Promise.resolve([]));
    const startedAt = Date.now();

    const worker = new BiliGuardWorker(
      {
        biliEventRepo: {
          claimNextBiliGuard: mock(() => Promise.resolve(event)),
          markClaimFailed,
          renewClaim: mock(() => Promise.resolve(true)),
        } as unknown as BiliEventRepository,
        logger: createLogger(),
        rewardProcessor: {
          previewBiliGuard,
          processBiliGuard: mock(() => Promise.reject(new Error('temporary failure'))),
        } as unknown as RewardProcessorService,
      },
      options,
    );

    expect(await worker.runOnce()).toBe(true);
    expect(previewBiliGuard).not.toHaveBeenCalled();
    expect(markClaimFailed).toHaveBeenCalledTimes(1);

    const retryInput = markClaimFailed.mock.calls[0]?.[2];
    expect(retryInput?.nextRetryAt.getTime()).toBeGreaterThanOrEqual(
      startedAt + options.retryBaseDelayMs * 2 ** event.retryCount,
    );
  });

  test('returns false when no pending event can be claimed', async () => {
    const worker = new BiliGuardWorker(
      {
        biliEventRepo: {
          claimNextBiliGuard: mock(() => Promise.resolve(null)),
        } as unknown as BiliEventRepository,
        logger: createLogger(),
        rewardProcessor: {} as RewardProcessorService,
      },
      options,
    );

    expect(await worker.runOnce()).toBe(false);
  });
});
