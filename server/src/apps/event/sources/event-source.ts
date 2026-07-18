import type { BiliEventEnvelope } from '#modules/bili-event';

export type BiliEventHandler = (event: BiliEventEnvelope) => void | Promise<void>;

export interface BiliEventSource {
  start(): Promise<void>;
  stop(): void;
  onEvent(handler: BiliEventHandler): () => void;
}

export class BiliEventSourceEmitter {
  private readonly handlers = new Set<BiliEventHandler>();

  on(handler: BiliEventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async emit(event: BiliEventEnvelope) {
    await Promise.all([...this.handlers].map(handler => handler(event)));
  }
}
