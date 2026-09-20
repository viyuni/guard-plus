import {
  CreatePointTypeSchema,
  PointTypeIconUploadSchema,
  PointTypeIdParamsSchema,
  UpdatePointTypeSchema,
} from '@shared/schema/point-type';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';
import { pointTypeUseCase } from '#modules/point';

export const pointTypeRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    pointTypeUseCase,
  },
  ({ authGuard, pointTypeUseCase }) =>
    new Elysia({
      name: 'PointTypeRoute',
      prefix: '/types',
      detail: {
        tags: ['PointType'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        () => {
          return pointTypeUseCase.list();
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
          return pointTypeUseCase.get(params.pointTypeId);
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
          return pointTypeUseCase.create(body);
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
          return pointTypeUseCase.update(params.pointTypeId, body);
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
          return pointTypeUseCase.updateIcon(params.pointTypeId, body);
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
          return pointTypeUseCase.enable(params.pointTypeId);
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
          return pointTypeUseCase.disable(params.pointTypeId);
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
