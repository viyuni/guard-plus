import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { createErrorHandler, health, openapi } from '#infrastructure/http';
import { createImageAssets } from '#infrastructure/storage';
import { version } from '~/package.json' with { type: 'json' };

import { createAdminApp } from './composition';

/**
 * Admin HTTP Server。
 *
 * Elysia 只出现在这一层: 组合根提供已经装配好的 `AdminHttp` 根 Ripple,
 * 这里只负责 serve 配置、CORS、错误映射、静态资源与文档。
 */
export async function createAdminServer() {
  const { runtime, container, logger, config } = await createAdminApp();

  const app = new Elysia({
    name: 'AdminServer',
    serve: {
      port: config.port,
      reusePort: true,
    },
  })
    .use(
      cors({
        origin: config.webOrigins,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        credentials: true,
      }),
    )
    .use(container.AdminHttp)
    .use(createErrorHandler(logger))
    .use(health)
    .use(createImageAssets({ assets: config.imageSavePath }))
    .get('/', () => 'Viyuni Guard plus server running... :)');

  if (config.nodeEnv === 'development') {
    app.use(
      openapi({
        title: 'Viyuni Guard Plus',
        version,
      }),
    );
  }

  // App 拥有 Runtime: HTTP 停止时释放依赖图。
  app.onStop(() => runtime.dispose());

  return {
    app,
    config,
    logger,
  };
}

export type AdminApp = Awaited<ReturnType<typeof createAdminServer>>['app'];
