import { createListener } from '@viyuni/bevent-relay';
import type { BliveListener, CookieSyncConfig } from '@viyuni/bevent-relay';

import { adaptBeventGuard, adaptBeventMessage } from '../adapters';
import {
  BiliEventSourceEmitter,
  type BiliEventHandler,
  type BiliEventSource,
} from './event-source';

export interface BeventEventSourceOptions {
  roomId: number;
  cookieSync: CookieSyncConfig;
  onError?: (error: unknown) => void;
  listener?: BliveListener;
}

export class BeventEventSource implements BiliEventSource {
  private readonly emitter = new BiliEventSourceEmitter();
  private readonly listener: BliveListener;
  private unsubscribe?: () => void;

  constructor(private readonly options: BeventEventSourceOptions) {
    this.listener =
      options.listener ??
      createListener({
        roomId: options.roomId,
        cookieSync: options.cookieSync,
      });
  }

  onEvent(handler: BiliEventHandler) {
    return this.emitter.on(handler);
  }

  async start() {
    this.unsubscribe = this.listener.on('event', raw => {
      const envelope =
        raw.type === 'guard'
          ? adaptBeventGuard(raw)
          : raw.type === 'message'
            ? adaptBeventMessage(raw)
            : null;

      if (!envelope) return;
      this.emitter.emit(envelope).catch(error => this.options.onError?.(error));
    });

    await this.listener.start();
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.listener.stop();
  }

  async refresh() {
    await this.listener.refreshCookie(true);
    await this.listener.restart();
  }
}
