export const BILI_EVENT_SCHEMA_VERSION = 1 as const;

export type BiliEventProvider = 'bevent' | 'laplace' | 'manual';

export type BiliEventChannel =
  | 'bevent-websocket'
  | 'laplace-event-bridge'
  | 'laplace-event-fetcher'
  | 'laplace-event-fetcher-backfill'
  | 'manual'
  | 'legacy';

export interface BiliEventSourceMeta {
  provider: BiliEventProvider;
  channel: BiliEventChannel;
  sourceEventId: string;
  receivedAt: number;
  adapterVersion: number;
}

export interface NormalizedBiliUser {
  biliUid: string;
  username: string;
  avatarUrl: string | null;
}

export interface NormalizedBiliGuardEvent {
  type: 'guard';
  id: string;
  roomId: number;
  occurredAt: number;
  user: NormalizedBiliUser;
  message: string;
  guardType: number;
  guardName: string;
  quantity: number;
  quantityNormalized: number;
  unit: string;
  isYear: boolean;
  price: number;
}

export interface NormalizedBiliMessageEvent {
  type: 'message';
  id: string;
  roomId: number;
  occurredAt: number;
  user: NormalizedBiliUser;
  content: string;
}

export type NormalizedBiliEvent = NormalizedBiliGuardEvent | NormalizedBiliMessageEvent;

export interface BiliEventEnvelope<
  TEvent extends NormalizedBiliEvent = NormalizedBiliEvent,
  TRaw = unknown,
> {
  schemaVersion: typeof BILI_EVENT_SCHEMA_VERSION;
  source: BiliEventSourceMeta;
  event: TEvent;
  raw: TRaw;
}

export type BiliGuardEventEnvelope<TRaw = unknown> = BiliEventEnvelope<
  NormalizedBiliGuardEvent,
  TRaw
>;

export type BiliMessageEventEnvelope<TRaw = unknown> = BiliEventEnvelope<
  NormalizedBiliMessageEvent,
  TRaw
>;

export function createBiliEventEnvelope<TEvent extends NormalizedBiliEvent, TRaw>(input: {
  source: BiliEventSourceMeta;
  event: TEvent;
  raw: TRaw;
}): BiliEventEnvelope<TEvent, TRaw> {
  return {
    schemaVersion: BILI_EVENT_SCHEMA_VERSION,
    ...input,
  };
}

export function isBiliGuardEventEnvelope(value: unknown): value is BiliGuardEventEnvelope {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<BiliGuardEventEnvelope>;
  return (
    candidate.schemaVersion === BILI_EVENT_SCHEMA_VERSION &&
    candidate.event?.type === 'guard' &&
    typeof candidate.event.id === 'string' &&
    typeof candidate.source?.provider === 'string' &&
    'raw' in candidate
  );
}
