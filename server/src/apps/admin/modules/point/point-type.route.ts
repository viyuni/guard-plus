import {
  CreatePointTypeSchema,
  PointTypeIconUploadSchema,
  PointTypeIdParamsSchema,
  UpdatePointTypeSchema,
} from '@shared/schema/point-type';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AdminAuthGuard } from '#apps/admin/http';
import { PointTypeUseCase } from '#modules/point';

export const PointTypeRoutes = ripple(
  {
    AdminAuthGuard,
    PointTypeUseCase,
  },
  ({ AdminAuthGuard, PointTypeUseCase }) =>
    new Elysia({
      name: 'PointTypeRoute',
      prefix: '/types',
      detail: {
        tags: ['PointType'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        () => {
          return PointTypeUseCase.list();
        },
        {
          requiredAdminAuth: true,

          detail: {
            description: '积分类型列表',
          },
        },
      )
      .get(
        '/:pointTypeId',
        ({ params }) => {
          return PointTypeUseCase.get(params.pointTypeId);
        },
        {
          params: PointTypeIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '积分类型详情',
          },
        },
      )
      .post(
        '/',
        ({ body }) => {
          return PointTypeUseCase.create(body);
        },
        {
          body: CreatePointTypeSchema,
          requiredAdminAuth: true,
          detail: {
            description: '创建积分类型',
          },
        },
      )
      .put(
        '/:pointTypeId',
        ({ body, params }) => {
          return PointTypeUseCase.update(params.pointTypeId, body);
        },
        {
          body: UpdatePointTypeSchema,
          params: PointTypeIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '更新积分类型',
          },
        },
      )
      .put(
        '/:pointTypeId/icon',
        ({ body, params }) => {
          return PointTypeUseCase.updateIcon(params.pointTypeId, body);
        },
        {
          body: PointTypeIconUploadSchema,
          params: PointTypeIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '更新积分类型图标',
            requestBody: {
              content: {
                'multipart/form-data': {},
              },
            },
          },
        },
      )
      .patch(
        '/:pointTypeId/enable',
        ({ params }) => {
          return PointTypeUseCase.enable(params.pointTypeId);
        },
        {
          params: PointTypeIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '启用积分类型',
          },
        },
      )
      .patch(
        '/:pointTypeId/disable',
        ({ params }) => {
          return PointTypeUseCase.disable(params.pointTypeId);
        },
        {
          params: PointTypeIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '停用积分类型',
          },
        },
      ),
);
