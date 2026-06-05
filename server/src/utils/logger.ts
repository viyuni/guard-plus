import pino from 'pino';
import pretty from 'pino-pretty';

import { sharedEnv } from '#env/shared';

function createLogger() {
  const stream =
    sharedEnv.NODE_ENV === 'development'
      ? pretty({
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        })
      : undefined;

  const logger = pino(
    {
      level: sharedEnv.LOG_LEVEL ?? 'info',
    },
    stream,
  );

  function printUrls(server: Bun.Server<unknown> | null) {
    if (!server) {
      return;
    }

    const protocol = 'http';
    const host = server.hostname === '0.0.0.0' ? 'localhost' : server.hostname;
    const baseUrl = `${protocol}://${host}:${server.port}`;

    logger.info(`➜  Local:   ${baseUrl}/`);

    // Dev mode print docs url
    if (sharedEnv.NODE_ENV === 'development') logger.info(`➜  Docs:    ${baseUrl}/openapi`);
  }

  function scope(name: string) {
    return logger.child({ scope: name });
  }

  return Object.assign(logger, {
    printUrls,
    scope,
  });
}

export const logger = createLogger();
