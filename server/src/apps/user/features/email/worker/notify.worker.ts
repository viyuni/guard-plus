import { Worker } from 'bunqueue/client';
import { ripple } from 'cyrenex';

import { Logger, type AppLogger } from '#infrastructure/logger';
import { NOTIFY_QUEUE_NAME, type NewOrderEmailInput } from '#infrastructure/queue';

import { EmailUseCase } from '../usecase';

interface NotifyWorkerDeps {
  emailUseCase: EmailUseCase;
  logger: AppLogger;
}

/**
 * 持有 bunqueue Worker 这一外部资源, 由 Runtime 按依赖顺序释放。
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
    const fields = { orderNo: job.data.orderNo };

    try {
      const result = await this.deps.emailUseCase.sendNewOrderEmail(job.data);
      this.deps.logger.info(
        {
          ...fields,
          event: result.recipients.length ? 'notification.sent' : 'notification.skipped',
          recipientCount: result.recipients.length,
        },
        result.recipients.length ? '订单通知邮件已发送' : '未配置收件人，跳过订单通知',
      );
    } catch (err) {
      this.deps.logger.error(
        { ...fields, event: 'notification.send.failed', err },
        '订单通知邮件发送失败',
      );
      throw err;
    }
  }

  get instance() {
    return this.worker;
  }

  async [Symbol.asyncDispose]() {
    await this.worker.close();
  }
}

export const NotifyWorker = ripple(
  'NotifyWorker',
  {
    EmailUseCase,
    Logger,
  },
  deps => new NotifyQueueWorker({ emailUseCase: deps.EmailUseCase, logger: deps.Logger }),
);
