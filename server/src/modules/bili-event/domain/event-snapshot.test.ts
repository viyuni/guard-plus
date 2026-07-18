import { describe, expect, it } from 'bun:test';

import { readBiliGuardEventSnapshot } from './event-snapshot';
import { createBiliEventEnvelope } from './events';

describe('Bilibili guard event snapshot', () => {
  it('直接读取新版事件信封', () => {
    const envelope = createBiliEventEnvelope({
      source: {
        provider: 'laplace',
        channel: 'laplace-event-fetcher',
        sourceEventId: 'source-id',
        receivedAt: 1_700_000_000_100,
        adapterVersion: 1,
      },
      event: {
        type: 'guard' as const,
        id: 'event-id',
        roomId: 721,
        occurredAt: 1_700_000_000_000,
        user: {
          biliUid: '123456',
          username: '测试用户',
          avatarUrl: null,
        },
        message: '测试事件',
        guardType: 3,
        guardName: '舰长',
        quantity: 1,
        quantityNormalized: 1,
        unit: '月',
        isYear: false,
        price: 198,
      },
      raw: { type: 'toast' },
    });

    expect(readBiliGuardEventSnapshot(envelope)).toBe(envelope);
  });

  it('兼容并包装旧版 bevent 事件快照', () => {
    const legacy = {
      id: 'legacy-event-id',
      uid: 123456,
      uname: '旧版用户',
      face: '',
      message: '旧版用户 开通了舰长',
      guardType: 3,
      guardName: '舰长',
      total: 1,
      totalNormalized: 1,
      unit: '月',
      isYearGuard: false,
      priceNormalized: 198,
      roomId: 721,
      timestamp: 1_700_000_000,
      timestampNormalized: 1_700_000_000_000,
    };

    const envelope = readBiliGuardEventSnapshot(legacy);

    expect(envelope.source).toEqual({
      provider: 'bevent',
      channel: 'legacy',
      sourceEventId: 'legacy-event-id',
      receivedAt: 1_700_000_000_000,
      adapterVersion: 0,
    });
    expect(envelope.event.user.username).toBe('旧版用户');
    expect(envelope.event.quantityNormalized).toBe(1);
    expect(envelope.raw).toBe(legacy);
  });

  it('拒绝无法识别的历史快照', () => {
    expect(() => readBiliGuardEventSnapshot({ type: 'unknown' })).toThrow(
      '无法识别的 B 站大航海事件快照',
    );
  });
});
