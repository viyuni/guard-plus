import { describe, expect, it } from 'bun:test';

import {
  adaptLaplaceMessage,
  adaptLaplaceToast,
  normalizeLaplaceGuardQuantity,
} from './laplace.adapter';

function createToast(overrides: Record<string, unknown> = {}) {
  return {
    type: 'toast',
    id: 'laplace-toast-id',
    stableKey: 'laplace-toast-stable-key',
    origin: 721,
    originIdx: 0,
    uid: 123456,
    username: '测试用户',
    avatar: 'https://example.com/avatar.png',
    message: '测试用户 开通了舰长',
    price: 198000,
    priceNormalized: 198,
    mockPrice: false,
    duration: 30,
    color: '#00aeec',
    toastType: 3,
    toastAmount: 2,
    toastAmountUnit: '月',
    toastName: '舰长',
    toastTotalCount: 100,
    toastId: 0,
    effectId: 0,
    timestamp: 1_700_000_000,
    timestampNormalized: 1_700_000_000_000,
    read: false,
    ...overrides,
  };
}

describe('Laplace event adapter', () => {
  it('归一化大航海关键字段并保留来源及完整原事件', () => {
    const raw = createToast();
    const envelope = adaptLaplaceToast(raw, {
      channel: 'laplace-event-fetcher',
      receivedAt: 1_700_000_000_100,
    });

    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.source).toEqual({
      provider: 'laplace',
      channel: 'laplace-event-fetcher',
      sourceEventId: 'laplace-toast-id',
      receivedAt: 1_700_000_000_100,
      adapterVersion: 1,
    });
    expect(envelope.event).toEqual({
      type: 'guard',
      id: 'laplace-toast-stable-key',
      roomId: 721,
      occurredAt: 1_700_000_000_000,
      user: {
        biliUid: '123456',
        username: '测试用户',
        avatarUrl: 'https://example.com/avatar.png',
      },
      message: '测试用户 开通了舰长',
      guardType: 3,
      guardName: '舰长',
      quantity: 2,
      quantityNormalized: 2,
      unit: '月',
      isYear: false,
      price: 198,
    });
    expect(envelope.raw).toBe(raw);
  });

  it('统一按月折算年费，非月/年单位不计入奖励月数', () => {
    expect(normalizeLaplaceGuardQuantity(2, '月')).toBe(2);
    expect(normalizeLaplaceGuardQuantity(2, '年')).toBe(24);
    expect(normalizeLaplaceGuardQuantity(1, '*8天')).toBe(0);

    const year = adaptLaplaceToast(createToast({ toastAmount: 1, toastAmountUnit: '年' }));
    expect(year.event.quantityNormalized).toBe(12);
    expect(year.event.isYear).toBe(true);
  });

  it('没有 stableKey 时回退使用 Laplace 原事件 ID', () => {
    const { stableKey: _stableKey, ...raw } = createToast();

    expect(adaptLaplaceToast(raw).event.id).toBe(raw.id);
  });

  it('归一化普通弹幕并保留原事件', () => {
    const raw = {
      type: 'message',
      id: 'laplace-message-id',
      origin: 721,
      originIdx: 0,
      uid: 123456,
      username: '测试用户',
      avatar: '',
      message: 'U-123456',
      timestamp: 1_700_000_000,
      timestampNormalized: 1_700_000_000_000,
      read: false,
    };
    const envelope = adaptLaplaceMessage(raw, { channel: 'laplace-event-bridge' });

    expect(envelope.event).toEqual({
      type: 'message',
      id: 'laplace-message-id',
      roomId: 721,
      occurredAt: 1_700_000_000_000,
      user: {
        biliUid: '123456',
        username: '测试用户',
        avatarUrl: null,
      },
      content: 'U-123456',
    });
    expect(envelope.source.channel).toBe('laplace-event-bridge');
    expect(envelope.raw).toBe(raw);
  });

  it('默认拒绝 mock 事件，但可显式允许开发环境处理', () => {
    const raw = createToast({ mock: true });

    expect(() => adaptLaplaceToast(raw)).toThrow('拒绝处理 Laplace mock 事件');
    expect(adaptLaplaceToast(raw, { acceptMock: true }).event.id).toBe('laplace-toast-stable-key');
  });

  it('拒绝缺少关键字段的事件', () => {
    const { toastType: _toastType, ...raw } = createToast();

    expect(() => adaptLaplaceToast(raw)).toThrow();
  });
});
