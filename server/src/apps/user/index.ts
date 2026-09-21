import { createUserServer } from './server';

const { app, config, logger } = await createUserServer();

app.compile().listen({}, server => {
  logger.printUrls(server, config.nodeEnv === 'development');
});
