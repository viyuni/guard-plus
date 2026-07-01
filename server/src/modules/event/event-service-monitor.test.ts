import { describe, expect, test } from 'bun:test';

import {
  EVENT_MONITOR_STATUS,
  EventServiceMonitor,
  getEventMonitorKey,
  isEventMonitorMessage,
  parseEventMonitorMessage,
  receiveEventMonitorMessage,
} from './event-service-monitor';

const ID = '123456789012345';

class MemoryRedis {
  readonly values = new Map<string, string>();
  readonly writes: Array<{ key: string; value: string; ttl: number }> = [];

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string, options: { EX: number }) {
    this.values.set(key, value);
    this.writes.push({ key, value, ttl: options.EX });
    return 'OK';
  }
}

function createService(
  redis: MemoryRedis,
  overrides: ConstructorParameters<typeof EventServiceMonitor>[1],
) {
  return new EventServiceMonitor(
    {
      redis,
      roomId: 1,
      cookieSync: { url: 'http://sync.test', password: 'secret' },
    },
    overrides,
  );
}

describe('EventServiceMonitor', () => {
  test('writes pending before sending the probe danmu', async () => {
    const redis = new MemoryRedis();
    let statusWhenSent: string | null = null;
    const service = createService(redis, {
      createId: () => ID,
      sender: {
        sendDanmu: async message => {
          expect(message).toBe(`咕咕嘎嘎@${ID}`);
          expect(message).toHaveLength(20);
          statusWhenSent = await redis.get(getEventMonitorKey(ID));
          return {};
        },
      },
    });

    expect(await service.send()).toBe(ID);
    expect(statusWhenSent as string | null).toBe(EVENT_MONITOR_STATUS.Pending);
    expect(redis.writes[0]?.ttl).toBe(30);
  });

  test('polls until the event listener marks the probe received', async () => {
    const redis = new MemoryRedis();
    let pollCount = 0;
    const service = createService(redis, {
      createId: () => ID,
      sender: { sendDanmu: async () => ({}) },
      sleep: async () => {
        pollCount += 1;
        await receiveEventMonitorMessage(redis, `咕咕嘎嘎@${ID}`);
      },
      timeoutMs: 100,
      pollIntervalMs: 1,
    });

    await service.send();

    expect(await service.check(ID)).toBe(true);
    expect(pollCount).toBe(1);
  });

  test('returns false when the check times out', async () => {
    const redis = new MemoryRedis();
    const service = createService(redis, {
      sender: { sendDanmu: async () => ({}) },
      sleep: Bun.sleep,
      timeoutMs: 5,
      pollIntervalMs: 1,
    });

    expect(await service.check(ID)).toBe(false);
  });
});

describe('event monitor message receiving', () => {
  test('accepts only the exact prefix and nanoid format', () => {
    expect(isEventMonitorMessage(`咕咕嘎嘎@${ID}`)).toBe(true);
    expect(isEventMonitorMessage(`x咕咕嘎嘎@${ID}`)).toBe(false);
    expect(isEventMonitorMessage(`咕咕嘎嘎@short`)).toBe(false);
    expect(isEventMonitorMessage(`咕咕嘎嘎@${ID}!`)).toBe(false);

    expect(parseEventMonitorMessage(`咕咕嘎嘎@${ID}`)).toBe(ID);
    expect(parseEventMonitorMessage(`x咕咕嘎嘎@${ID}`)).toBeNull();
    expect(parseEventMonitorMessage(`咕咕嘎嘎@short`)).toBeNull();
    expect(parseEventMonitorMessage(`咕咕嘎嘎@${ID}!`)).toBeNull();
  });

  test('writes received status for a valid message', async () => {
    const redis = new MemoryRedis();

    expect(await receiveEventMonitorMessage(redis, `咕咕嘎嘎@${ID}`)).toBe(true);
    expect(await redis.get(getEventMonitorKey(ID))).toBe(EVENT_MONITOR_STATUS.Received);
  });
});
