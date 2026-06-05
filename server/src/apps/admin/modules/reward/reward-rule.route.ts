import {
  CreateRewardRuleSchema,
  RewardRuleIdParamsSchema,
  UpdateRewardRuleSchema,
} from '@shared/schema/reward';
import Elysia from 'elysia';

import { RewardErrors } from '#modules/reward';

import { appContext } from '../../context';

export const rewardRuleRoute = new Elysia({
  name: 'RewardRuleRoute',
  prefix: '/rules',
  detail: {
    tags: ['RewardRule'],
  },
})
  .use(appContext)
  .error(RewardErrors)
  .get(
    '/',
    ({ rewardRuleUseCase }) => {
      return rewardRuleUseCase.listManage();
    },
    {
      requiredAdminAuth: true,
      detail: {
        description: '积分奖励规则列表',
      },
    },
  )
  .get(
    '/:rewardRuleId',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.get(params.rewardRuleId);
    },
    {
      params: RewardRuleIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '积分奖励规则详情',
      },
    },
  )
  .post(
    '/',
    ({ body, rewardRuleUseCase }) => {
      return rewardRuleUseCase.create(body);
    },
    {
      body: CreateRewardRuleSchema,
      requiredAdminAuth: true,
      detail: {
        description: '创建积分奖励规则',
      },
    },
  )
  .put(
    '/:rewardRuleId',
    ({ body, params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.update(params.rewardRuleId, body);
    },
    {
      body: UpdateRewardRuleSchema,
      params: RewardRuleIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '更新积分奖励规则',
      },
    },
  )
  .patch(
    '/:rewardRuleId/enable',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.enable(params.rewardRuleId);
    },
    {
      params: RewardRuleIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '启用积分奖励规则',
      },
    },
  )
  .patch(
    '/:rewardRuleId/disable',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.disable(params.rewardRuleId);
    },
    {
      params: RewardRuleIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '停用积分奖励规则',
      },
    },
  )
  .delete(
    '/:rewardRuleId',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.remove(params.rewardRuleId);
    },
    {
      params: RewardRuleIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '删除积分奖励规则',
      },
    },
  );
