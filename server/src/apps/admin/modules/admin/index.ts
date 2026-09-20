import {
  AdminCreateSchema,
  AdminIdParamsSchema,
  AdminPageQuerySchema,
  AdminUpdatePasswordSchema,
  AdminUpdateSchema,
  SuperAdminUpdateSchema,
} from '@shared/schema/admin';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';

import { AdminErrors } from './domain';
import { adminUseCase } from './usecase';

export * from './repository';
export * from './domain';

export const adminRoutes = ripple(
  {
    adminUseCase,
    authGuard: adminAuthGuard,
  },
  ({ adminUseCase, authGuard }) =>
    new Elysia({
      name: 'AdminRoute',
      prefix: '/admin',
    })
      .use(authGuard)
      .error(AdminErrors)
      .get('/', ({ query }) => adminUseCase.page(query), {
        query: AdminPageQuerySchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '管理员列表',
        },
      })
      .get('/me', ({ auth: { id: adminId } }) => adminUseCase.me(adminId), {
        requiredAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '获取当前管理员信息',
        },
      })
      .patch('/me', ({ auth: { id: adminId }, body }) => adminUseCase.updateMe(adminId, body), {
        body: AdminUpdateSchema,
        requiredAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '更新当前管理员信息',
        },
      })
      .post('/', ({ body }) => adminUseCase.create(body), {
        body: AdminCreateSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '创建管理员',
        },
      })
      .patch('/:adminId', ({ params, body }) => adminUseCase.update(params.adminId, body), {
        body: SuperAdminUpdateSchema,
        params: AdminIdParamsSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '超级管理员更新管理员信息',
        },
      })
      .patch('/:adminId/ban', ({ params }) => adminUseCase.ban(params.adminId), {
        params: AdminIdParamsSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '封禁普通管理员',
        },
      })
      .patch('/:adminId/restore', ({ params }) => adminUseCase.restore(params.adminId), {
        params: AdminIdParamsSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '解封普通管理员',
        },
      })
      .patch(
        '/updatePassword',
        ({ auth: { id: adminId }, body }) => adminUseCase.updatePassword(adminId, body),
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
        ({ params }) => adminUseCase.resetPassword(params.adminId),
        {
          params: AdminIdParamsSchema,
          requiredSuperAdminAuth: true,
          detail: {
            tags: ['Admin'],
            description: '重置普通管理员密码',
          },
        },
      ),
);
