import {
  CreatePointTypeSchema,
  PointTypeIconUploadSchema,
  PointTypeIdParamsSchema,
  UpdatePointTypeSchema,
} from '@shared/schema/point-type';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Point from '#modules/point';

import { AdminAuthGuard } from '../../auth';

export const PointTypeRoutes = ripple(
  {
    AdminAuthGuard,
    PointTypeAdminUseCase: Point.PointTypeAdminUseCase,
    PointTypeQuery: Point.PointTypeQuery,
  },
  ({ AdminAuthGuard, PointTypeAdminUseCase, PointTypeQuery }) =>
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
          return PointTypeQuery.list();
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
          return PointTypeQuery.get(params.pointTypeId);
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
          return PointTypeAdminUseCase.create(body);
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
          return PointTypeAdminUseCase.update(params.pointTypeId, body);
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
          return PointTypeAdminUseCase.updateIcon(params.pointTypeId, body);
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
          return PointTypeAdminUseCase.enable(params.pointTypeId);
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
          return PointTypeAdminUseCase.disable(params.pointTypeId);
        },
        {
          params: PointTypeIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '停用积分类型',
          },
        },
      ),
  { debugName: 'PointTypeRoutes' },
);
