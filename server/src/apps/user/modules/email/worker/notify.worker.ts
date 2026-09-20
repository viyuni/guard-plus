import { Worker } from 'bunqueue/client';
import { ripple } from 'cyrenejs';

import { NOTIFY_QUEUE_NAME, type NewOrderEmailInput } from '#queues';

import { EmailUseCase } from '../usecase';

interface NotifyWorkerDeps {
  emailUseCase: EmailUseCase;
}

/**
 * 持有 bunqueue Worker 这一外部资源, 由容器按依赖顺序释放。
 */
export class NotifyQueueWorker {
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

export const NotifyWorker = ripple(
  {
    EmailUseCase,
  },
  deps => new NotifyQueueWorker({ emailUseCase: deps.EmailUseCase }),
  {
    debugName: 'NotifyWorker',
    dispose: worker => worker.instance.close(),
  },
);
