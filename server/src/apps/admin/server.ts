import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { errorHandler } from '#modules/error-handler';
import { health } from '#modules/health';
import { image } from '#modules/image';
import { openapi } from '#modules/openapi';
import { version } from '~/package.json' with { type: 'json' };

import { appRuntimeContext } from './context';
import { adminAppConfig, adminEnv } from './env';

export const app = new Elysia({
  name: 'AdminServer',
  serve: {
    port: adminEnv.ADMIN_PORT,
    reusePort: true,
  },
})
  .use(
    cors({
      origin: adminEnv.ADMIN_WEB_ORIGINS,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true,
    }),
  )
  .use(appRuntimeContext)
  .use(errorHandler)
  .use(health)
  .use(image({ assets: adminAppConfig.imageSavePath }))
  .get('/', () => 'Viyuni Guard plus server running... :)');

if (adminAppConfig.nodeEnv === 'development') {
  app.use(
    openapi({
      title: 'Viyuni Guard Plus',
      version,
    }),
  );
}
