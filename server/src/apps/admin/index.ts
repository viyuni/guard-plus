import { createAdminServer } from './server';

const { app, config, logger } = await createAdminServer();

app.compile().listen({}, server => {
  logger.printUrls(server, config.nodeEnv === 'development');
});
