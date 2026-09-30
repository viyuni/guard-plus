import { cors } from '@elysia/cors';
import { Elysia } from 'elysia';

import { imageSavePath } from '#config';
import { createErrorHandler, health, openapi } from '#infrastructure/http';
import { createImageAssets } from '#infrastructure/storage';
import { version } from '~/package.json' with { type: 'json' };

import { createAdminApp } from './composition';

/**
 * Admin HTTP Server。
 *
 * Elysia 只出现在这一层: 组合根提供持有依赖图的 cyrene 插件与装配好的
 * `AdminHttp` 根 Ripple, 这里只负责 serve 配置、CORS、错误映射、静态资源与文档。
 */
export async function createAdminServer() {
  const { config, container, ripples } = await createAdminApp();
  const logger = ripples.Logger;

  const app = new Elysia({
    name: 'AdminServer',
    serve: {
      port: config.port,
      reusePort: true,
    },
  })
    .use(
      cors({
        origin: ripples.WebOrigins,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        credentials: true,
      }),
    )
    // cyrene 插件必须先安装: 它提供容器并负责停止时释放依赖图。
    .use(container)
    .use(ripples.AdminHttp)
    .use(createErrorHandler(logger))
    .use(health)
    .use(createImageAssets({ assets: imageSavePath }))
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

export type AdminApp = Awaited<ReturnType<typeof createAdminServer>>['app'];
