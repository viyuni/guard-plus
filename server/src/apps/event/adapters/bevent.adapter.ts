import type { Guard, Message } from '@viyuni/bevent-relay/events';

import {
  createBiliEventEnvelope,
  type BiliGuardEventEnvelope,
  type BiliMessageEventEnvelope,
  type NormalizedBiliGuardEvent,
  type NormalizedBiliMessageEvent,
} from '#modules/bili-event';

export const BEVENT_ADAPTER_VERSION = 1;

export function adaptBeventGuard(
  raw: Guard,
  receivedAt = Date.now(),
): BiliGuardEventEnvelope<Guard> {
  const occurredAt = raw.timestamp > 9_999_999_999 ? raw.timestamp : raw.timestampNormalized;
  const event: NormalizedBiliGuardEvent = {
    type: 'guard',
    id: raw.id,
    roomId: raw.roomId,
    occurredAt,
    user: {
      biliUid: String(raw.uid),
      username: raw.uname,
      avatarUrl: raw.face || null,
    },
    message: raw.message,
    guardType: raw.guardType,
    guardName: raw.guardName,
    quantity: raw.total,
    quantityNormalized: raw.totalNormalized,
    unit: raw.unit,
    isYear: raw.isYearGuard,
    price: raw.priceNormalized,
  };

  return createBiliEventEnvelope({
    source: {
      provider: 'bevent',
      channel: 'bevent-websocket',
      sourceEventId: raw.id,
      receivedAt,
      adapterVersion: BEVENT_ADAPTER_VERSION,
    },
    event,
    raw,
  });
}

export function adaptBeventMessage(
  raw: Message,
  receivedAt = Date.now(),
): BiliMessageEventEnvelope<Message> {
  const event: NormalizedBiliMessageEvent = {
    type: 'message',
    id: raw.id,
    roomId: raw.roomId,
    occurredAt: raw.timestamp,
    user: {
      biliUid: String(raw.uid),
      username: raw.uname,
      avatarUrl: raw.face || null,
    },
    content: raw.content,
  };

  return createBiliEventEnvelope({
    source: {
      provider: 'bevent',
      channel: 'bevent-websocket',
      sourceEventId: raw.id,
      receivedAt,
      adapterVersion: BEVENT_ADAPTER_VERSION,
    },
    event,
    raw,
  });
}
