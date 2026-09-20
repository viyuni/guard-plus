import {
  ConvertPointSchema,
  CreatePointConversionRuleSchema,
  PointConversionRuleIdParamsSchema,
  UpdatePointConversionRuleSchema,
} from '@shared/schema/point-conversion';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';
import { pointConversionUseCase } from '#modules/point';

export const pointConversionRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    pointConversionUseCase,
  },
  ({ authGuard, pointConversionUseCase }) =>
    new Elysia({
      name: 'PointConversionRoute',
      prefix: '/conversions',
      detail: {
        tags: ['PointConversion'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        () => {
          return pointConversionUseCase.listManage();
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
          return pointConversionUseCase.create(body);
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
          return pointConversionUseCase.update(params.pointConversionRuleId, body);
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
          return pointConversionUseCase.enable(params.pointConversionRuleId);
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
          return pointConversionUseCase.disable(params.pointConversionRuleId);
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
          return pointConversionUseCase.remove(params.pointConversionRuleId);
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
          return pointConversionUseCase.convert(body);
        },
        {
          body: ConvertPointSchema,
          requiredAdminAuth: true,
          detail: {
            description: '执行积分转换',
          },
        },
      ),
);
