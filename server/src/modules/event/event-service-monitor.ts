import { createListener } from '@viyuni/bevent-relay';
import type { BliveListener, CookieSyncConfig } from '@viyuni/bevent-relay';
import { nanoid } from 'nanoid';

export const EVENT_MONITOR_MESSAGE_PREFIX = '咕咕嘎嘎@';

const MESSAGE_LENGTH = 20;
const ID_LENGTH = MESSAGE_LENGTH - EVENT_MONITOR_MESSAGE_PREFIX.length;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const KEY_PREFIX = 'event:monitor:';
const KEY_TTL_SECONDS = 30;
const CHECK_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 250;

export const EVENT_MONITOR_STATUS = {
  Pending: 'pending',
  Received: 'received',
} as const;

interface EventMonitorRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
}

export interface EventServiceMonitorOptions {
  redis: EventMonitorRedis;
  roomId: number;
  cookieSync: CookieSyncConfig;
}

interface EventServiceMonitorTestOptions {
  sender?: Pick<BliveListener, 'sendDanmu'>;
  createId?: () => string;
  sleep?: (milliseconds: number) => Promise<unknown>;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export function getEventMonitorKey(id: string) {
  return `${KEY_PREFIX}${id}`;
}

function isEventMonitorId(id: string) {
  return id.length === ID_LENGTH && ID_PATTERN.test(id);
}

export function parseEventMonitorMessage(content: string) {
  if (!content.startsWith(EVENT_MONITOR_MESSAGE_PREFIX)) return null;

  const id = content.slice(EVENT_MONITOR_MESSAGE_PREFIX.length);
  return isEventMonitorId(id) ? id : null;
}

export function isEventMonitorMessage(content: string) {
  return parseEventMonitorMessage(content) !== null;
}

export async function receiveEventMonitorMessage(redis: EventMonitorRedis, content: string) {
  const id = parseEventMonitorMessage(content);
  if (!id) return false;

  await redis.set(getEventMonitorKey(id), EVENT_MONITOR_STATUS.Received, {
    EX: KEY_TTL_SECONDS,
  });
  return true;
}

export class EventServiceMonitor {
  private readonly sender: Pick<BliveListener, 'sendDanmu'>;
  private readonly createId: () => string;
  private readonly sleep: (milliseconds: number) => Promise<unknown>;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;

  constructor(
    private readonly options: EventServiceMonitorOptions,
    testOptions: EventServiceMonitorTestOptions = {},
  ) {
    // This listener is only a cookie-backed danmu sender. It is intentionally never started.
    this.sender =
      testOptions.sender ??
      createListener({
        roomId: options.roomId,
        cookieSync: options.cookieSync,
      });
    this.createId = testOptions.createId ?? (() => nanoid(ID_LENGTH));
    this.sleep = testOptions.sleep ?? Bun.sleep;
    this.timeoutMs = testOptions.timeoutMs ?? CHECK_TIMEOUT_MS;
    this.pollIntervalMs = testOptions.pollIntervalMs ?? POLL_INTERVAL_MS;
  }

  async send() {
    const id = this.createId();

    if (!isEventMonitorId(id)) {
      throw new Error(`Event monitor id must be a ${ID_LENGTH}-character nanoid`);
    }

    await this.options.redis.set(getEventMonitorKey(id), EVENT_MONITOR_STATUS.Pending, {
      EX: KEY_TTL_SECONDS,
    });
    await this.sender.sendDanmu(`${EVENT_MONITOR_MESSAGE_PREFIX}${id}`);

    return id;
  }

  async check(id: string) {
    if (!isEventMonitorId(id)) return false;

    const deadline = Date.now() + this.timeoutMs;

    while (Date.now() < deadline) {
      const status = await this.options.redis.get(getEventMonitorKey(id));
      if (status === EVENT_MONITOR_STATUS.Received) return true;

      const remaining = deadline - Date.now();
      if (remaining <= 0) break;

      await this.sleep(Math.min(this.pollIntervalMs, remaining));
    }

    return false;
  }
}
