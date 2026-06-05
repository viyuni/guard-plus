import { staticPlugin } from '@elysia/static';
import Elysia from 'elysia';

export * from './usecase';
export * from './domain';

export const image = ({ assets }: { assets: string }) =>
  new Elysia({ name: 'ImageModule' }).use(
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
