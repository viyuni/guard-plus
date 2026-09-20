import { createListener } from '@viyuni/bevent-relay';
import type { Guard } from '@viyuni/bevent-relay/events';
import { Worker } from 'bunqueue/client';

import { db } from '#db';
import { publishBilibiliGuardEvent } from '#queues';
import { BILIBILI_EVENT_QUEUE_NAME } from '#queues';
import { redis } from '#redis';
import { logger } from '#utils/logger';

import { createEventContainer } from './context';
import { eventAppConfig, eventEnv } from './env';
import { createEventServer } from './server';

const { runtime, biliPasswordResetUseCase, biliRegisterUseCase, rewardUseCase } =
  await createEventContainer({
    db,
    redis,
    config: eventAppConfig,
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
  roomId: eventAppConfig.biliRoom,
  cookieSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
  loginCheck: {
    autoReconnect: true,
  },
  heartbeat: {},
});

listener.on('event', event => {
  if (event.type === 'guard') {
    publishBilibiliGuardEvent(event);
    logger.info(event, 'Bilibili Guard Message');

    return;
  }

  if (event.type === 'message') {
    biliRegisterUseCase
      .matchMessage({
        code: event.content,
        biliUid: event.uid.toString(),
        biliName: event.uname,
      })
      .catch(error => logger.error(error, 'Bilibili register message match failed'));
    biliPasswordResetUseCase
      .matchMessage({
        code: event.content,
        biliUid: event.uid.toString(),
        biliName: event.uname,
      })
      .catch(error => logger.error(error, 'Bilibili password reset message match failed'));

    return;
  }

  if (eventAppConfig.nodeEnv === 'development') {
    logger.info(event, 'Bilibili Event');
  }
});

createEventServer(listener, eventEnv.EVENT_PORT)
  .onStop(async () => {
    await listener.stop();
    await _worker.close();
    await runtime.dispose();
  })
  .compile()
  .listen({}, logger.printUrls);

await listener.start().then(() => {
  logger.info('Bilibili Event Listener started...');
});
