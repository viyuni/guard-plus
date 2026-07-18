import { ConnectionState, LaplaceEventBridgeClient } from '@laplace.live/event-bridge-sdk';

import type { BiliEventChannel } from '#modules/bili-event';

import { adaptLaplaceMessage, adaptLaplaceToast } from '../adapters';
import {
  BiliEventSourceEmitter,
  type BiliEventHandler,
  type BiliEventSource,
} from './event-source';

export interface LaplaceEventSourceOptions {
  url: string;
  token?: string;
  roomId: number;
  channel: Extract<BiliEventChannel, 'laplace-event-bridge' | 'laplace-event-fetcher'>;
  acceptMock?: boolean;
  onError?: (error: unknown) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

function withRoomFilter(url: string, roomId: number) {
  const target = new URL(url);
  target.searchParams.set('rooms', String(roomId));
  return target.toString();
}

export class LaplaceEventSource implements BiliEventSource {
  private readonly emitter = new BiliEventSourceEmitter();
  private readonly client: LaplaceEventBridgeClient;
  private readonly unsubscribers: Array<() => void> = [];

  constructor(private readonly options: LaplaceEventSourceOptions) {
    this.client = new LaplaceEventBridgeClient({
      url: withRoomFilter(options.url, options.roomId),
      token: options.token,
      reconnect: true,
    });
  }

  onEvent(handler: BiliEventHandler) {
    return this.emitter.on(handler);
  }

  async start() {
    const adapterOptions = {
      channel: this.options.channel,
      acceptMock: this.options.acceptMock,
    } as const;

    this.unsubscribers.push(
      this.client.on('toast', raw => {
        try {
          const envelope = adaptLaplaceToast(raw, adapterOptions);
          if (envelope.event.roomId !== this.options.roomId) return;
          this.emitter.emit(envelope).catch(error => this.options.onError?.(error));
        } catch (error) {
          this.options.onError?.(error);
        }
      }),
      this.client.on('message', raw => {
        try {
          const envelope = adaptLaplaceMessage(raw, adapterOptions);
          if (envelope.event.roomId !== this.options.roomId) return;
          this.emitter.emit(envelope).catch(error => this.options.onError?.(error));
        } catch (error) {
          this.options.onError?.(error);
        }
      }),
      this.client.onConnectionStateChange(state => this.options.onConnectionStateChange?.(state)),
    );

    await this.client.connect();
  }

  stop() {
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
    this.client.disconnect();
  }
}

export { ConnectionState };
