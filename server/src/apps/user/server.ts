import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { createErrorHandler, health, openapi } from '#infrastructure/http';
import { createImageAssets } from '#infrastructure/storage';
import { version } from '~/package.json' with { type: 'json' };

import { createUserApp } from './composition';

/**
 * User HTTP Server。
 *
 * Elysia 只出现在这一层: 组合根提供已经装配好的 `UserHttp` 根 Ripple,
 * 这里只负责 serve 配置、CORS、错误映射、静态资源与文档。
 */
export async function createUserServer() {
  const { runtime, container, logger, config } = await createUserApp();

  const app = new Elysia({
    serve: {
      port: config.port,
      reusePort: true,
    },
  })
    .use(
      cors({
        origin: config.webOrigins,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
      }),
    )
    .use(container.UserHttp)
    .use(createErrorHandler(logger))
    .use(createImageAssets({ assets: config.imageSavePath }))
    .use(health)
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

export type UserApp = Awaited<ReturnType<typeof createUserServer>>['app'];
