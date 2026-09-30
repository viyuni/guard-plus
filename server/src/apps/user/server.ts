import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { imageSavePath } from '#config';
import { createErrorHandler, health, openapi } from '#infrastructure/http';
import { createImageAssets } from '#infrastructure/storage';
import { version } from '~/package.json' with { type: 'json' };

import { createUserApp } from './composition';

/**
 * User HTTP Server。
 *
 * Elysia 只出现在这一层: 组合根提供持有依赖图的 cyrene 插件与装配好的
 * `UserHttp` 根 Ripple, 这里只负责 serve 配置、CORS、错误映射、静态资源与文档。
 */
export async function createUserServer() {
  const { config, container, ripples } = await createUserApp();
  const logger = ripples.Logger;

  const app = new Elysia({
    serve: {
      port: config.port,
      reusePort: true,
    },
  })
    .use(
      cors({
        origin: ripples.WebOrigins,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
      }),
    )
    // cyrene 插件必须先安装: 它提供容器并负责停止时释放依赖图。
    .use(container)
    .use(ripples.UserHttp)
    .use(createErrorHandler(logger))
    .use(createImageAssets({ assets: imageSavePath }))
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

  return {
    app,
    config,
    logger,
  };
}

export type UserApp = Awaited<ReturnType<typeof createUserServer>>['app'];
