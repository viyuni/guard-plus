import { describe, expect, it } from 'bun:test';

import type { Guard, Message } from '@viyuni/bevent-relay/events';

import { adaptBeventGuard, adaptBeventMessage } from './bevent.adapter';

describe('bevent event adapter', () => {
  it('归一化大航海事件并保留 bevent 原事件', () => {
    const raw = {
      type: 'guard',
      id: 'bevent-guard-id',
      uid: 123456,
      uname: '测试用户',
      face: '',
      message: '测试用户 开通了舰长',
      guardType: 3,
      guardName: '舰长',
      priceNormalized: 198,
      total: 1,
      totalNormalized: 1,
      unit: '月',
      isYearGuard: false,
      roomId: 721,
      timestamp: 1_700_000_000,
      timestampNormalized: 1_700_000_000_000,
    } as Guard;

    const envelope = adaptBeventGuard(raw, 1_700_000_000_100);

    expect(envelope.source).toEqual({
      provider: 'bevent',
      channel: 'bevent-websocket',
      sourceEventId: 'bevent-guard-id',
      receivedAt: 1_700_000_000_100,
      adapterVersion: 1,
    });
    expect(envelope.event.user).toEqual({
      biliUid: '123456',
      username: '测试用户',
      avatarUrl: null,
    });
    expect(envelope.event.quantityNormalized).toBe(1);
    expect(envelope.event.occurredAt).toBe(1_700_000_000_000);
    expect(envelope.raw).toBe(raw);
  });

  it('归一化 bevent 普通弹幕', () => {
    const raw = {
      type: 'message',
      id: 'bevent-message-id',
      timestamp: 1_700_000_000_000,
      uid: 123456,
      uname: '测试用户',
      face: '',
      content: 'U-123456',
      roomId: 721,
    } as Message;

    const envelope = adaptBeventMessage(raw);

    expect(envelope.event).toEqual({
      type: 'message',
      id: 'bevent-message-id',
      roomId: 721,
      occurredAt: 1_700_000_000_000,
      user: {
        biliUid: '123456',
        username: '测试用户',
        avatarUrl: null,
      },
      content: 'U-123456',
    });
    expect(envelope.raw).toBe(raw);
  });
});
