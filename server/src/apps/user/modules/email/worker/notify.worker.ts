import { Worker } from 'bunqueue/client';

import { NOTIFY_QUEUE_NAME, type NewOrderEmailInput } from '#queues';

import type { EmailUseCase } from '../usecase';

export interface NotifyWorkerDeps {
  emailUseCase: EmailUseCase;
}

export class NotifyWorker {
  private readonly worker: Worker<NewOrderEmailInput>;

  constructor(private readonly deps: NotifyWorkerDeps) {
    this.worker = new Worker<NewOrderEmailInput>(NOTIFY_QUEUE_NAME, job => this.handle(job), {
      embedded: true,
      concurrency: 3,
    });
  }

  private async handle(job: { data: NewOrderEmailInput }) {
    await this.deps.emailUseCase.sendNewOrderEmail(job.data);
  }

  get instance() {
    return this.worker;
  }
}
