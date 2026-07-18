import * as v from 'valibot';

import {
  createBiliEventEnvelope,
  type BiliEventChannel,
  type BiliGuardEventEnvelope,
  type BiliMessageEventEnvelope,
  type NormalizedBiliGuardEvent,
  type NormalizedBiliMessageEvent,
} from '#modules/bili-event';

export const LAPLACE_ADAPTER_VERSION = 1;

const LaplaceBaseEventSchema = {
  id: v.string(),
  origin: v.pipe(v.number(), v.integer()),
  uid: v.pipe(v.number(), v.integer()),
  username: v.string(),
  avatar: v.string(),
  timestamp: v.number(),
  timestampNormalized: v.number(),
  mock: v.optional(v.boolean()),
};

export const LaplaceToastSchema = v.looseObject({
  type: v.literal('toast'),
  ...LaplaceBaseEventSchema,
  stableKey: v.optional(v.string()),
  message: v.string(),
  priceNormalized: v.number(),
  toastType: v.pipe(v.number(), v.integer()),
  toastAmount: v.number(),
  toastAmountUnit: v.string(),
  toastName: v.string(),
});

export const LaplaceMessageSchema = v.looseObject({
  type: v.literal('message'),
  ...LaplaceBaseEventSchema,
  message: v.string(),
});

export interface LaplaceAdapterOptions {
  channel?: Extract<
    BiliEventChannel,
    'laplace-event-bridge' | 'laplace-event-fetcher' | 'laplace-event-fetcher-backfill'
  >;
  receivedAt?: number;
  acceptMock?: boolean;
}

export function normalizeLaplaceGuardQuantity(quantity: number, unit: string) {
  if (unit === '月') return quantity;
  if (unit === '年') return quantity * 12;
  return 0;
}

function assertMockAllowed(event: { mock?: boolean }, acceptMock: boolean) {
  if (event.mock && !acceptMock) {
    throw new Error('拒绝处理 Laplace mock 事件');
  }
}

export function adaptLaplaceToast(
  raw: unknown,
  options: LaplaceAdapterOptions = {},
): BiliGuardEventEnvelope {
  const parsed = v.parse(LaplaceToastSchema, raw);
  assertMockAllowed(parsed, options.acceptMock ?? false);

  const event: NormalizedBiliGuardEvent = {
    type: 'guard',
    id: parsed.stableKey ?? parsed.id,
    roomId: parsed.origin,
    occurredAt: parsed.timestampNormalized,
    user: {
      biliUid: String(parsed.uid),
      username: parsed.username,
      avatarUrl: parsed.avatar || null,
    },
    message: parsed.message,
    guardType: parsed.toastType,
    guardName: parsed.toastName,
    quantity: parsed.toastAmount,
    quantityNormalized: normalizeLaplaceGuardQuantity(parsed.toastAmount, parsed.toastAmountUnit),
    unit: parsed.toastAmountUnit,
    isYear: parsed.toastAmountUnit === '年',
    price: parsed.priceNormalized,
  };

  return createBiliEventEnvelope({
    source: {
      provider: 'laplace',
      channel: options.channel ?? 'laplace-event-fetcher',
      sourceEventId: parsed.id,
      receivedAt: options.receivedAt ?? Date.now(),
      adapterVersion: LAPLACE_ADAPTER_VERSION,
    },
    event,
    raw,
  });
}

export function adaptLaplaceMessage(
  raw: unknown,
  options: LaplaceAdapterOptions = {},
): BiliMessageEventEnvelope {
  const parsed = v.parse(LaplaceMessageSchema, raw);
  assertMockAllowed(parsed, options.acceptMock ?? false);

  const event: NormalizedBiliMessageEvent = {
    type: 'message',
    id: parsed.id,
    roomId: parsed.origin,
    occurredAt: parsed.timestampNormalized,
    user: {
      biliUid: String(parsed.uid),
      username: parsed.username,
      avatarUrl: parsed.avatar || null,
    },
    content: parsed.message,
  };

  return createBiliEventEnvelope({
    source: {
      provider: 'laplace',
      channel: options.channel ?? 'laplace-event-fetcher',
      sourceEventId: parsed.id,
      receivedAt: options.receivedAt ?? Date.now(),
      adapterVersion: LAPLACE_ADAPTER_VERSION,
    },
    event,
    raw,
  });
}
