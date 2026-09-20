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

import { AdminAuthGuard } from '#apps/admin/http';

import { AdminErrors } from './domain';
import { AdminUseCase } from './usecase';

export * from './repository';
export * from './domain';

export const AdminRoutes = ripple(
  {
    AdminUseCase,
    AdminAuthGuard,
  },
  ({ AdminUseCase, AdminAuthGuard }) =>
    new Elysia({
      name: 'AdminRoute',
      prefix: '/admin',
    })
      .use(AdminAuthGuard)
      .error(AdminErrors)
      .get('/', ({ query }) => AdminUseCase.page(query), {
        query: AdminPageQuerySchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '管理员列表',
        },
      })
      .get('/me', ({ auth: { id: adminId } }) => AdminUseCase.me(adminId), {
        requiredAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '获取当前管理员信息',
        },
      })
      .patch('/me', ({ auth: { id: adminId }, body }) => AdminUseCase.updateMe(adminId, body), {
        body: AdminUpdateSchema,
        requiredAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '更新当前管理员信息',
        },
      })
      .post('/', ({ body }) => AdminUseCase.create(body), {
        body: AdminCreateSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '创建管理员',
        },
      })
      .patch('/:adminId', ({ params, body }) => AdminUseCase.update(params.adminId, body), {
        body: SuperAdminUpdateSchema,
        params: AdminIdParamsSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '超级管理员更新管理员信息',
        },
      })
      .patch('/:adminId/ban', ({ params }) => AdminUseCase.ban(params.adminId), {
        params: AdminIdParamsSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '封禁普通管理员',
        },
      })
      .patch('/:adminId/restore', ({ params }) => AdminUseCase.restore(params.adminId), {
        params: AdminIdParamsSchema,
        requiredSuperAdminAuth: true,
        detail: {
          tags: ['Admin'],
          description: '解封普通管理员',
        },
      })
      .patch(
        '/updatePassword',
        ({ auth: { id: adminId }, body }) => AdminUseCase.updatePassword(adminId, body),
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
        ({ params }) => AdminUseCase.resetPassword(params.adminId),
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
