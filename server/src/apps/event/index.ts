import { createListener } from '@viyuni/bevent-relay';
import type { Guard } from '@viyuni/bevent-relay/events';
import { Worker } from 'bunqueue/client';

import { createAppContext } from '#context';
import { sharedEnv } from '#env/shared';
import { publishBilibiliGuardEvent } from '#queues';
import { BILIBILI_EVENT_QUEUE_NAME } from '#queues';
import { logger } from '#utils/logger';
import { db } from '~/src/db';

import { eventEnv } from './env';

const {
  container: {
    useCases: { biliRegisterUseCase, rewardUseCase },
  },
} = createAppContext({
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

Bun.cron('0 4 * * *', () => listener.refreshCookieAndRestart());
