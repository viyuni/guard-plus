import {
  CreateRewardRuleSchema,
  RewardRuleIdParamsSchema,
  UpdateRewardRuleSchema,
} from '@shared/schema/reward';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';
import { RewardErrors } from '#modules/reward';
import { rewardRuleUseCase } from '#modules/reward';

export const rewardRuleRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    rewardRuleUseCase,
  },
  ({ authGuard, rewardRuleUseCase }) =>
    new Elysia({
      name: 'RewardRuleRoute',
      prefix: '/rules',
      detail: {
        tags: ['RewardRule'],
      },
    })
      .use(authGuard)
      .error(RewardErrors)
      .get(
        '/',
        () => {
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
        ({ params }) => {
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
        ({ body }) => {
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
        ({ body, params }) => {
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
        ({ params }) => {
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
        ({ params }) => {
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
        ({ params }) => {
          return rewardRuleUseCase.remove(params.rewardRuleId);
        },
        {
          params: RewardRuleIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '删除积分奖励规则',
          },
        },
      ),
);
