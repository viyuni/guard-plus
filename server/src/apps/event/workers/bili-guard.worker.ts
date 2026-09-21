import { randomUUID } from 'node:crypto';

import type { BiliEvent } from '#infrastructure/db/schema';
import type { AppLogger } from '#infrastructure/logger';
import type { BiliEventRepository } from '#modules/bili-event';
import { BiliEventPersistFailedError } from '#modules/bili-event';
import { getErrorSnapshot, type BiliGuardRewardEvent } from '#modules/reward';
import type { RewardProcessorService } from '#modules/reward';

import type { BiliGuardWorkerOptions } from '../config';

interface BiliGuardWorkerDeps {
  biliEventRepo: BiliEventRepository;
  logger: AppLogger;
  rewardProcessor: RewardProcessorService;
}

export class BiliGuardWorker {
  private readonly workerId = randomUUID();
  private readonly inFlight = new Set<Promise<void>>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pollPromise: Promise<void> | undefined;
  private wakeRequested = false;
  private isRunning = false;

  constructor(
    private readonly deps: BiliGuardWorkerDeps,
    private readonly options: BiliGuardWorkerOptions,
  ) {}

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.schedule(0);
  }

  wake() {
    if (!this.isRunning) {
      return;
    }

    this.schedule(0);
  }

  async stop() {
    this.isRunning = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    await this.pollPromise;
    await Promise.allSettled(this.inFlight);
  }

  async runOnce() {
    const claimId = `${this.workerId}:${randomUUID()}`;
    const now = new Date();

    const event = await this.deps.biliEventRepo.claimNextBiliGuard({
      claimId,
      now,
      leaseUntil: new Date(now.getTime() + this.options.leaseMs),
      maxRetries: this.options.maxRetries,
    });

    if (!event) {
      return false;
    }

    await this.processClaim(event, claimId);

    return true;
  }

  private schedule(delay: number) {
    if (this.pollPromise) {
      this.wakeRequested = true;
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.pollPromise = this.poll().finally(() => {
        this.pollPromise = undefined;

        if (this.isRunning) {
          const nextDelay = this.wakeRequested ? 0 : this.options.pollIntervalMs;
          this.wakeRequested = false;
          this.schedule(nextDelay);
        }
      });
    }, delay);
  }

  private async poll() {
    try {
      while (this.isRunning && this.inFlight.size < this.options.concurrency) {
        const claimId = `${this.workerId}:${randomUUID()}`;
        const now = new Date();

        const event = await this.deps.biliEventRepo.claimNextBiliGuard({
          claimId,
          now,
          leaseUntil: new Date(now.getTime() + this.options.leaseMs),
          maxRetries: this.options.maxRetries,
        });

        if (!event) {
          break;
        }

        const task = this.processClaim(event, claimId)
          .catch(error => {
            this.deps.logger.error(error, 'Bilibili guard worker failed unexpectedly');
          })
          .finally(() => {
            this.inFlight.delete(task);
            this.wake();
          });

        this.inFlight.add(task);
      }
    } catch (error) {
      this.deps.logger.error(error, 'Bilibili guard worker polling failed');
    }
  }

  private async processClaim(event: BiliEvent, claimId: string) {
    const heartbeat = setInterval(
      () => {
        const leaseUntil = new Date(Date.now() + this.options.leaseMs);

        this.deps.biliEventRepo.renewClaim(event.biliEventId, claimId, leaseUntil).catch(error => {
          this.deps.logger.error(
            { error, biliEventId: event.biliEventId },
            'Bilibili guard lease renewal failed',
          );
        });
      },
      Math.max(1_000, Math.floor(this.options.leaseMs / 3)),
    );

    try {
      const snapshot = event.eventSnapshot as BiliGuardRewardEvent;
      let rewardItems = event.rewardItemSnapshots;

      if (!event.rewardPlanCreatedAt) {
        rewardItems = await this.deps.rewardProcessor.previewBiliGuard(snapshot);

        const planned = await this.deps.biliEventRepo.saveClaimedRewardPlan(
          event.biliEventId,
          claimId,
          rewardItems,
        );

        if (!planned) {
          throw new BiliEventPersistFailedError('大航海奖励计划保存失败或任务租约已失效');
        }
      }

      const result = await this.deps.rewardProcessor.processBiliGuard(snapshot, rewardItems);

      if (result.ignored) {
        await this.requirePersisted(
          this.deps.biliEventRepo.markClaimIgnored(event.biliEventId, claimId, result.ignoreReason),
          event.biliEventId,
        );
        return;
      }

      await this.requirePersisted(
        this.deps.biliEventRepo.markClaimSucceeded(event.biliEventId, claimId, {
          userId: result.user.id,
          rewardResultSnapshots: result.rewardResultSnapshots,
        }),
        event.biliEventId,
      );
    } catch (error) {
      const retryDelay = Math.min(
        this.options.retryMaxDelayMs,
        this.options.retryBaseDelayMs * 2 ** event.retryCount,
      );

      const failed = await this.deps.biliEventRepo.markClaimFailed(event.biliEventId, claimId, {
        ...getErrorSnapshot(error),
        nextRetryAt: new Date(Date.now() + retryDelay),
      });

      if (!failed) {
        this.deps.logger.warn(
          { biliEventId: event.biliEventId },
          'Bilibili guard failure ignored because the task lease changed',
        );
      }
    } finally {
      clearInterval(heartbeat);
    }
  }

  private async requirePersisted(persisted: Promise<BiliEvent | null>, biliEventId: string) {
    if (!(await persisted)) {
      throw new BiliEventPersistFailedError(
        `大航海事件 ${biliEventId} 状态保存失败或任务租约已失效`,
      );
    }
  }
}
