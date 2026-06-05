import {
  ConvertPointSchema,
  CreatePointConversionRuleSchema,
  PointConversionRuleIdParamsSchema,
  UpdatePointConversionRuleSchema,
} from '@shared/schema/point-conversion';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const pointConversionRoute = new Elysia({
  name: 'PointConversionRoute',
  prefix: '/conversions',
  detail: {
    tags: ['PointConversion'],
  },
})

  .use(appContext)
  .get(
    '/',
    ({ pointConversionUseCase }) => {
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
    ({ body, pointConversionUseCase }) => {
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
    ({ body, params, pointConversionUseCase }) => {
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
    ({ params, pointConversionUseCase }) => {
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
    ({ params, pointConversionUseCase }) => {
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
    ({ params, pointConversionUseCase }) => {
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
    ({ body, pointConversionUseCase }) => {
      return pointConversionUseCase.convert(body);
    },
    {
      body: ConvertPointSchema,
      requiredAdminAuth: true,
      detail: {
        description: '执行积分转换',
      },
    },
  );
