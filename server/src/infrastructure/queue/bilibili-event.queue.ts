import type { Guard } from '@viyuni/bevent-relay/events';
import { Queue } from 'bunqueue/client';

export const BILIBILI_EVENT_QUEUE_NAME = 'bilibiliEvent' as const;

export const bilibiliEventQueue = new Queue<Guard>(BILIBILI_EVENT_QUEUE_NAME, {
  embedded: true,
});

export async function publishBilibiliGuardEvent(event: Guard) {
  await bilibiliEventQueue.add(BILIBILI_EVENT_QUEUE_NAME, event, {
    attempts: 2,
    backoff: 1000,
    durable: true,
  });
}
