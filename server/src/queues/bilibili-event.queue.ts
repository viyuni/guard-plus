import { Queue } from 'bunqueue/client';

import type { BiliGuardEventEnvelope } from '#modules/bili-event';

export const BILIBILI_EVENT_QUEUE_NAME = 'bilibiliEvent' as const;

export const bilibiliEventQueue = new Queue<BiliGuardEventEnvelope>(BILIBILI_EVENT_QUEUE_NAME, {
  embedded: true,
});

export async function publishBilibiliGuardEvent(event: BiliGuardEventEnvelope) {
  await bilibiliEventQueue.add(BILIBILI_EVENT_QUEUE_NAME, event, {
    attempts: 2,
    backoff: 1000,
    durable: true,
  });
}
