import cors from '@elysia/cors';
import { Elysia } from 'elysia';

import { imageEnv } from '#env/image';
import { errorHandler } from '#modules/error-handler';
import { health } from '#modules/health';
import { image } from '#modules/image';
import { openapi } from '#modules/openapi';
import { version } from '~/package.json' with { type: 'json' };

import { appRuntimeContext } from './context';
import { userEnv } from './env';

export const app = new Elysia({
  serve: {
    port: userEnv.USER_PORT,
    reusePort: true,
  },
})
  .use(
    cors({
      origin: userEnv.USER_WEB_ORIGINS,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  )
  .use(appRuntimeContext)

  .use(errorHandler)
  .use(image({ assets: imageEnv.IMAGE_SAVE_PATH }))
  .use(health)
  .get('/', () => 'Viyuni Guard plus server running... :)');

if (userEnv.NODE_ENV === 'development') {
  app.use(
    openapi({
      title: 'Viyuni Guard Plus',
      version,
    }),
  );
}
