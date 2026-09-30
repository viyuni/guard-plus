import type { AppLogger } from '#infrastructure/logger';

import type { createEventHealthServer } from './http';
import type { BilibiliSource } from './source';
import type { BiliGuardWorker } from './workers';

interface EventServiceDeps {
  healthServer: ReturnType<typeof createEventHealthServer>;
  logger: AppLogger;
  runtime: {
    dispose: () => Promise<void>;
  };
  source: BilibiliSource;
  worker: BiliGuardWorker;
}

/** Event App 的显式生命周期边界。 */
export class EventService {
  private isStarted = false;
  private stopPromise: Promise<void> | undefined;

  constructor(private readonly deps: EventServiceDeps) {}

  async start() {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;

    try {
      this.deps.worker.start();
      this.deps.healthServer.compile().listen({}, server => {
        this.deps.logger.printUrls(server, false);
      });
      await this.deps.source.start();
      this.deps.logger.info('Bilibili Event Source started');
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  stop() {
    this.stopPromise ??= this.stopOnce();

    return this.stopPromise;
  }

  private async stopOnce() {
    try {
      await this.deps.source.stop();
    } catch (error) {
      this.deps.logger.error(error, 'Bilibili Event Source stop failed');
    }

    await this.close('Bilibili guard worker', () => this.deps.worker.stop());
    await this.close('Event health server', () => this.deps.healthServer.stop());
    // 数据库与 Redis 由容器持有, dispose() 会按资源协议释放。
    await this.close('Event dependency runtime', () => this.deps.runtime.dispose());

    this.isStarted = false;
  }

  private async close(name: string, close: () => unknown) {
    try {
      await close();
    } catch (error) {
      this.deps.logger.error(error, `${name} stop failed`);
    }
  }
}
