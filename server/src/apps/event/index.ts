import { createListener } from '@viyuni/bevent-relay';

import { createEventContainer } from '#context';
import { sharedEnv } from '#env/shared';
import { publishBilibiliGuardEvent } from '#queues';
import { logger } from '#utils/logger';

import { eventEnv } from './env';

const {
  useCases: { biliRegisterUseCase },
} = createEventContainer({
  env: eventEnv,
});

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
