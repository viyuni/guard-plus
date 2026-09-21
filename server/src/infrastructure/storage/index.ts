import { mkdirSync } from 'node:fs';

import { staticPlugin } from '@elysia/static';
import Elysia from 'elysia';

export * from './errors';
export * from './local-image-storage';

/**
 * 已上传图片的静态访问适配器。
 *
 * 属于 HTTP adapter, 由 App 组装时挂载。
 */
export const createImageAssets = ({ assets }: { assets: string }) => {
  mkdirSync(assets, { recursive: true });

  return new Elysia({ name: 'ImageAssets' }).use(
    staticPlugin({
      assets,
      prefix: '/images',
      etag: true,
      maxAge: 31536000,
      directive: 'immutable',
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      indexHTML: false,
      staticLimit: -1,
      detail: {
        tags: ['Image'],
        description: '访问已上传的公开图片资源',
        responses: {
          200: {
            description: '图片文件内容',
            content: {
              'image/webp': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          404: {
            description: '图片不存在',
          },
        },
      },
    }),
  );
};
