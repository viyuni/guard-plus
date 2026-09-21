import { createListener, type BliveListener, type ListenerEvents } from '@viyuni/bevent-relay';

import type { AppLogger } from '#infrastructure/logger';

import type { EventConfig } from '../config';
import type { BiliGuardConsumer, BiliVerificationConsumer } from '../consumers';

interface BilibiliSourceDeps {
  guardConsumer: BiliGuardConsumer;
  logger: AppLogger;
  verificationConsumer: BiliVerificationConsumer;
  wakeGuardWorker: () => void;
}

export class BilibiliSource {
  private readonly inFlight = new Set<Promise<void>>();
  private readonly unsubscribe: () => void;

  constructor(
    readonly listener: BliveListener,
    private readonly deps: BilibiliSourceDeps,
  ) {
    this.unsubscribe = listener.on('event', event => {
      const task = this.consume(event).finally(() => {
        this.inFlight.delete(task);
      });

      this.inFlight.add(task);
    });
  }

  get state() {
    return this.listener.state;
  }

  start() {
    return this.listener.start();
  }

  async stop() {
    const errors: unknown[] = [];

    try {
      this.unsubscribe();
    } catch (error) {
      errors.push(error);
    }

    try {
      this.listener.dispose();
    } catch (error) {
      errors.push(error);
    }

    await Promise.allSettled(this.inFlight);

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Bilibili source stop failed');
    }
  }

  private async consume(event: ListenerEvents['event'][0]) {
    if (event.type === 'guard') {
      try {
        await this.deps.guardConsumer.consume(event);
        this.deps.wakeGuardWorker();
      } catch (error) {
        this.deps.logger.error(error, 'Bilibili guard event persistence failed');
      }

      return;
    }

    if (event.type === 'message') {
      try {
        await this.deps.verificationConsumer.consume({
          content: event.content,
          uid: event.uid,
          uname: event.uname,
        });
      } catch (error) {
        this.deps.logger.error(error, 'Bilibili verification message match failed');
      }

      return;
    }

    this.deps.logger.debug(event, 'Bilibili event ignored');
  }
}

export function createBilibiliSource(config: EventConfig, deps: BilibiliSourceDeps) {
  const listener = createListener({
    roomId: config.biliRoom,
    cookieSync: config.loginSync,
    loginCheck: {
      autoReconnect: true,
    },
    heartbeat: {},
  });

  return new BilibiliSource(listener, deps);
}
