import { createListener } from '@viyuni/bevent-relay';

import { createEventApp } from './composition';
import { eventConfig } from './config';
import { createEventServer } from './server';

const { container, logger, runtime } = await createEventApp();

const listener = createListener({
  roomId: eventConfig.biliRoom,
  cookieSync: {
    url: eventConfig.loginSync.url,
    password: eventConfig.loginSync.password,
  },
  loginCheck: {
    autoReconnect: true,
  },
  heartbeat: {},
});

listener.on('event', event => {
  if (event.type === 'guard') {
    void container.EventHandler.handleGuardEvent(event);

    return;
  }

  if (event.type === 'message') {
    container.EventHandler.handleMessage({
      content: event.content,
      uid: event.uid,
      uname: event.uname,
    });

    return;
  }

  if (eventConfig.nodeEnv === 'development') {
    logger.info(event, 'Bilibili Event');
  }
});

createEventServer(listener, eventConfig.port)
  .onStop(async () => {
    await listener.stop();
    await runtime.dispose();
  })
  .compile()
  .listen({}, server => logger.printUrls(server, false));

await listener.start().then(() => {
  logger.info('Bilibili Event Listener started...');
});
