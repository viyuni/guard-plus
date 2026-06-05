import {
  AdminCreateSchema,
  AdminIdParamsSchema,
  AdminPageQuerySchema,
  AdminUpdatePasswordSchema,
  AdminUpdateSchema,
  SuperAdminUpdateSchema,
} from '@shared/schema/admin';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';

import { AdminErrors } from './domain';

export * from './repository';
export * from './domain';

export const admin = new Elysia({
  name: 'AdminRoute',
  prefix: '/admin',
})
  .use(appContext)
  .error(AdminErrors)
  .get('/', ({ query, adminUseCase }) => adminUseCase.page(query), {
    query: AdminPageQuerySchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '管理员列表',
    },
  })
  .get('/me', ({ auth: { id: adminId }, adminUseCase }) => adminUseCase.me(adminId), {
    requiredAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '获取当前管理员信息',
    },
  })
  .patch(
    '/me',
    ({ auth: { id: adminId }, body, adminUseCase }) => adminUseCase.updateMe(adminId, body),
    {
      body: AdminUpdateSchema,
      requiredAdminAuth: true,
      detail: {
        tags: ['Admin'],
        description: '更新当前管理员信息',
      },
    },
  )
  .post('/', ({ body, adminUseCase }) => adminUseCase.create(body), {
    body: AdminCreateSchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '创建管理员',
    },
  })
  .patch(
    '/:adminId',
    ({ params, body, adminUseCase }) => adminUseCase.update(params.adminId, body),
    {
      body: SuperAdminUpdateSchema,
      params: AdminIdParamsSchema,
      requiredSuperAdminAuth: true,
      detail: {
        tags: ['Admin'],
        description: '超级管理员更新管理员信息',
      },
    },
  )
  .patch('/:adminId/ban', ({ params, adminUseCase }) => adminUseCase.ban(params.adminId), {
    params: AdminIdParamsSchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '封禁普通管理员',
    },
  })
  .patch('/:adminId/restore', ({ params, adminUseCase }) => adminUseCase.restore(params.adminId), {
    params: AdminIdParamsSchema,
    requiredSuperAdminAuth: true,
    detail: {
      tags: ['Admin'],
      description: '解封普通管理员',
    },
  })
  .patch(
    '/updatePassword',
    ({ auth: { id: adminId }, body, adminUseCase }) => adminUseCase.updatePassword(adminId, body),
    {
      body: AdminUpdatePasswordSchema,
      requiredAdminAuth: true,
      detail: {
        tags: ['Admin'],
        description: '修改管理员密码',
      },
    },
  )
  .patch(
    '/:adminId/resetPassword',
    ({ params, adminUseCase }) => adminUseCase.resetPassword(params.adminId),
    {
      params: AdminIdParamsSchema,
      requiredSuperAdminAuth: true,
      detail: {
        tags: ['Admin'],
        description: '重置普通管理员密码',
      },
    },
  );
