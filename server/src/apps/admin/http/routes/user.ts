import {
  UserIdParamsSchema,
  UserPageQuerySchema,
  UserRegisterSchema,
  UserUpdateSchema,
} from '@shared/schema/user';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import AdminUserFeature from '#apps/admin/features/user';
import User from '#modules/user';

import { AdminAuthGuard } from '../auth';

export const AdminUserRoutes = ripple(
  {
    AdminAuthGuard,
    AdminUserUseCase: AdminUserFeature.AdminUserUseCase,
    UserUseCase: User.UserUseCase,
  },
  ({ AdminAuthGuard, AdminUserUseCase, UserUseCase }) =>
    new Elysia({
      name: 'UserRoute',
      prefix: '/users',
      detail: {
        tags: ['User'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        ({ query }) => {
          return UserUseCase.page(query);
        },
        {
          query: UserPageQuerySchema,
          requiredAdminAuth: true,
          detail: {
            description: '用户列表',
          },
        },
      )
      .post(
        '/',
        async ({ body }) => {
          return await AdminUserUseCase.create(body);
        },
        {
          body: UserRegisterSchema,
          requiredAdminAuth: true,
          detail: {
            description: '用户注册',
          },
        },
      )
      .patch(
        '/:userId',
        async ({ params, body }) => {
          return await UserUseCase.update(params.userId, body);
        },
        {
          params: UserIdParamsSchema,
          body: UserUpdateSchema,
          requiredAdminAuth: true,
          detail: {
            description: '更新用户信息',
          },
        },
      )
      .patch(
        '/:userId/ban',
        async ({ params }) => {
          const { id, status } = await UserUseCase.ban(params.userId);

          return {
            id,
            status,
          };
        },
        {
          params: UserIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '封禁用户',
          },
        },
      )
      .patch(
        '/:userId/restore',
        async ({ params }) => {
          const { id, status } = await UserUseCase.restore(params.userId);

          return {
            id,
            status,
          };
        },
        {
          params: UserIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '恢复用户',
          },
        },
      )
      .patch(
        '/:userId/resetPassword',
        async ({ params }) => {
          return await UserUseCase.resetPassword(params.userId);
        },
        {
          params: UserIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '重置用户密码',
          },
        },
      ),
  { debugName: 'AdminUserRoutes' },
);
