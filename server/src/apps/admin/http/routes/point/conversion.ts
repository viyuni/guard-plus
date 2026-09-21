import {
  ConvertPointSchema,
  CreatePointConversionRuleSchema,
  PointConversionRuleIdParamsSchema,
  UpdatePointConversionRuleSchema,
} from '@shared/schema/point-conversion';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Point from '#modules/point';

import { AdminAuthGuard } from '../../auth';

export const PointConversionRoutes = ripple(
  {
    AdminAuthGuard,
    PointConversionUseCase: Point.PointConversionUseCase,
  },
  ({ AdminAuthGuard, PointConversionUseCase }) =>
    new Elysia({
      name: 'PointConversionRoute',
      prefix: '/conversions',
      detail: {
        tags: ['PointConversion'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        () => {
          return PointConversionUseCase.listManage();
        },
        {
          requiredAdminAuth: true,
          detail: {
            description: '积分转换规则列表',
          },
        },
      )
      .post(
        '/',
        ({ body }) => {
          return PointConversionUseCase.create(body);
        },
        {
          body: CreatePointConversionRuleSchema,
          requiredAdminAuth: true,
          detail: {
            description: '创建积分转换规则',
          },
        },
      )
      .put(
        '/:pointConversionRuleId',
        ({ body, params }) => {
          return PointConversionUseCase.update(params.pointConversionRuleId, body);
        },
        {
          body: UpdatePointConversionRuleSchema,
          params: PointConversionRuleIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '更新积分转换规则',
          },
        },
      )
      .patch(
        '/:pointConversionRuleId/enable',
        ({ params }) => {
          return PointConversionUseCase.enable(params.pointConversionRuleId);
        },
        {
          params: PointConversionRuleIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '启用积分转换规则',
          },
        },
      )
      .patch(
        '/:pointConversionRuleId/disable',
        ({ params }) => {
          return PointConversionUseCase.disable(params.pointConversionRuleId);
        },
        {
          params: PointConversionRuleIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '停用积分转换规则',
          },
        },
      )
      .delete(
        '/:pointConversionRuleId',
        ({ params }) => {
          return PointConversionUseCase.remove(params.pointConversionRuleId);
        },
        {
          params: PointConversionRuleIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '删除积分转换规则',
          },
        },
      )
      .post(
        '/convert',
        ({ body }) => {
          return PointConversionUseCase.convert(body);
        },
        {
          body: ConvertPointSchema,
          requiredAdminAuth: true,
          detail: {
            description: '执行积分转换',
          },
        },
      ),
  { debugName: 'PointConversionRoutes' },
);
