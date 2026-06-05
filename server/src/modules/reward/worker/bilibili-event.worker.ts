import type { Guard } from '@viyuni/bevent-relay/events';
import { Worker } from 'bunqueue/client';

import { BILIBILI_EVENT_QUEUE_NAME } from '#queues';

import type { RewardUseCase } from '../usecase';

export interface BilibiliEventWorkerDeps {
  rewardUseCase: RewardUseCase;
}

export class BilibiliEventWorker {
  private readonly worker: Worker<Guard>;

  constructor(private readonly deps: BilibiliEventWorkerDeps) {
    this.worker = new Worker<Guard>(BILIBILI_EVENT_QUEUE_NAME, job => this.handle(job), {
      embedded: true,
      concurrency: 5,
    });
  }

  private async handle(job: { data: Guard }) {
    await this.deps.rewardUseCase.rewardBiliGuard(job.data);
  }

  get instance() {
    return this.worker;
  }
}
