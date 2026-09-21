import { openapi as elysiaOpenapi } from '@elysia/openapi';
import { toJsonSchema } from '@valibot/to-json-schema';

interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

interface LicenseObject {
  name: string;
  url?: string;
}

interface InfoObject {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  version: string;
}

export function openapi(info?: InfoObject) {
  return elysiaOpenapi({
    mapJsonSchema: {
      valibot: (schema: any) =>
        toJsonSchema(schema, { target: 'openapi-3.0', errorMode: 'ignore' }),
    },
    documentation: {
      info,
      components: {
        securitySchemes: {
          Authorization: {
            type: 'apiKey',
            in: 'cookie',
            name: 'authToken',
            description: 'JWT Cookie',
          },
        },
      },
      tags: [
        { name: 'Health', description: '健康检查' },
        { name: 'Auth', description: '认证相关' },
        { name: 'PointType', description: '积分系统' },
        { name: 'PointAccount', description: '积分账户' },
        { name: 'PointTransaction', description: '积分流水' },
        { name: 'Order', description: '订单系统' },
        { name: 'User', description: '用户系统' },
        { name: 'Admin', description: '管理员系统' },
        { name: 'Image', description: '图片系统' },
        { name: 'Product', description: '商品系统' },
      ],
    },
  });
}
