import { createListener } from '@viyuni/bevent-relay';
import type { Guard } from '@viyuni/bevent-relay/events';
import { Worker } from 'bunqueue/client';

import { createEventContainer } from '#context';
import { sharedEnv } from '#env/shared';
import {
  EventServiceMonitor,
  isEventMonitorMessage,
  receiveEventMonitorMessage,
} from '#modules/event';
import { publishBilibiliGuardEvent } from '#queues';
import { BILIBILI_EVENT_QUEUE_NAME } from '#queues';
import { redis } from '#redis';
import { logger } from '#utils/logger';
import { db } from '~/src/db';

import { eventEnv } from './env';

const {
  useCases: { biliRegisterUseCase, rewardUseCase },
} = createEventContainer({
  db,
  env: eventEnv,
});

const _worker = new Worker<Guard>(
  BILIBILI_EVENT_QUEUE_NAME,
  job => {
    return rewardUseCase.rewardBiliGuard(job.data);
  },
  {
    embedded: true,
    concurrency: 5,
  },
);

const listener = createListener({
  roomId: eventEnv.BILI_ROOM,
  cookieSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
});

const eventServiceMonitor = new EventServiceMonitor({
  redis,
  roomId: eventEnv.BILI_ROOM,
  cookieSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
});
const eventServiceMonitorLogger = logger.scope('EventServiceMonitor');

async function checkEventService() {
  try {
    const probeId = await eventServiceMonitor.send();
    const healthy = await eventServiceMonitor.check(probeId);

    if (healthy) {
      eventServiceMonitorLogger.info({ probeId }, 'Event service check succeeded');
      return;
    }

    eventServiceMonitorLogger.error({ probeId }, 'Event service check timed out');
  } catch (error) {
    eventServiceMonitorLogger.error(error, 'Event service check failed');
  }
}

listener.on('event', event => {
  if (event.type === 'guard') {
  }

  switch (event.type) {
    case 'guard': {
      publishBilibiliGuardEvent(event);
      logger.info(event, 'Bilibili Guard Message');
      break;
    }
    case 'message': {
      // logger.info(event, 'Bilibili Message');

      if (isEventMonitorMessage(event.content)) {
        receiveEventMonitorMessage(redis, event.content).catch(error =>
          logger.error(error, 'Event monitor message receive failed'),
        );
        break;
      }

      biliRegisterUseCase
        .matchMessage({
          code: event.content,
          biliUid: event.uid.toString(),
          biliName: event.uname,
        })
        .catch(error => logger.error(error, 'Bilibili register message match failed'));

      break;
    }
    case 'gift':
    case 'superChat':
    case 'superChatDelete':
    case 'liveStart':
    case 'liveEnd':
    case 'liveCutoff':
    case 'liveWarning':
    case 'likesUpdate':
    case 'likeClick':
    case 'entryEffect': {
      if (sharedEnv.NODE_ENV === 'development') console.log(event);
    }
  }
});

listener.start().then(() => {
  logger.info('Bilibili Event Listener started...');
});

Bun.cron('0 4 * * *', async () => {
  await listener.refreshCookie(true);
  await listener.restart();
});

Bun.cron('0 * * * *', checkEventService);
