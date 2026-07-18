import { Worker } from 'bunqueue/client';

import { createEventContainer } from '#context';
import { readBiliGuardEventSnapshot } from '#modules/bili-event';
import { EventServiceMonitor } from '#modules/event';
import { BILIBILI_EVENT_QUEUE_NAME } from '#queues';
import { redis } from '#redis';
import { logger } from '#utils/logger';
import { db } from '~/src/db';

import { createBiliEventDispatcher } from './dispatch';
import { eventEnv } from './env';
import {
  BeventEventSource,
  ConnectionState,
  LaplaceEventSource,
  type BiliEventSource,
} from './sources';

const {
  useCases: { biliRegisterUseCase, rewardUseCase },
} = createEventContainer({
  db,
  env: eventEnv,
});

const _worker = new Worker<unknown>(
  BILIBILI_EVENT_QUEUE_NAME,
  job => {
    return rewardUseCase.rewardBiliGuard(readBiliGuardEventSnapshot(job.data));
  },
  {
    embedded: true,
    concurrency: 5,
  },
);

const eventServiceMonitor = new EventServiceMonitor({
  redis,
  roomId: eventEnv.BILI_ROOM,
  cookieSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
});
const eventServiceMonitorLogger = logger.scope('EventServiceMonitor');
const eventSourceLogger = logger.scope('BilibiliEventSource');

function createEventSource(): BiliEventSource {
  if (eventEnv.EVENT_SOURCE === 'laplace') {
    if (!eventEnv.LAPLACE_EVENT_BRIDGE_URL) {
      throw new Error('EVENT_SOURCE=laplace 时必须配置 LAPLACE_EVENT_BRIDGE_URL');
    }

    return new LaplaceEventSource({
      url: eventEnv.LAPLACE_EVENT_BRIDGE_URL,
      token: eventEnv.LAPLACE_EVENT_BRIDGE_TOKEN,
      roomId: eventEnv.BILI_ROOM,
      channel:
        eventEnv.LAPLACE_SERVER_KIND === 'eventBridge'
          ? 'laplace-event-bridge'
          : 'laplace-event-fetcher',
      acceptMock: eventEnv.NODE_ENV !== 'production' && eventEnv.LAPLACE_ACCEPT_MOCK === '1',
      onError: error => eventSourceLogger.error(error, 'Laplace event handling failed'),
      onConnectionStateChange: state => {
        const message = `Laplace connection state changed: ${state}`;
        if (state === ConnectionState.CONNECTED) {
          eventSourceLogger.info(message);
        } else {
          eventSourceLogger.warn(message);
        }
      },
    });
  }

  return new BeventEventSource({
    roomId: eventEnv.BILI_ROOM,
    cookieSync: {
      url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
      password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
    },
    onError: error => eventSourceLogger.error(error, 'bevent event handling failed'),
  });
}

const eventSource = createEventSource();
const dispatchBiliEvent = createBiliEventDispatcher({ biliRegisterUseCase });

eventSource.onEvent(dispatchBiliEvent);

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

eventSource
  .start()
  .then(() =>
    eventSourceLogger.info({ source: eventEnv.EVENT_SOURCE }, 'Bilibili event source started'),
  )
  .catch(error => eventSourceLogger.error(error, 'Bilibili event source start failed'));

if (eventSource instanceof BeventEventSource) {
  Bun.cron('0 4 * * *', () => eventSource.refresh());
}

Bun.cron('0 * * * *', checkEventService);

function stopEventSource() {
  eventSource.stop();
}

process.once('SIGINT', stopEventSource);
process.once('SIGTERM', stopEventSource);
