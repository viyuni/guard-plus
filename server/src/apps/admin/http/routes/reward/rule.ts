import {
  CreateRewardRuleSchema,
  RewardRuleIdParamsSchema,
  UpdateRewardRuleSchema,
} from '@shared/schema/reward';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Reward, { RewardErrors } from '#modules/reward';

import { AdminAuthGuard } from '../../auth';

export const RewardRuleRoutes = ripple(
  {
    AdminAuthGuard,
    RewardRuleUseCase: Reward.RewardRuleUseCase,
  },
  ({ AdminAuthGuard, RewardRuleUseCase }) =>
    new Elysia({
      name: 'RewardRuleRoute',
      prefix: '/rules',
      detail: {
        tags: ['RewardRule'],
      },
    })
      .use(AdminAuthGuard)
      .error(RewardErrors)
      .get(
        '/',
        () => {
          return RewardRuleUseCase.listManage();
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
          return RewardRuleUseCase.get(params.rewardRuleId);
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
          return RewardRuleUseCase.create(body);
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
          return RewardRuleUseCase.update(params.rewardRuleId, body);
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
          return RewardRuleUseCase.enable(params.rewardRuleId);
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
          return RewardRuleUseCase.disable(params.rewardRuleId);
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
          return RewardRuleUseCase.remove(params.rewardRuleId);
        },
        {
          params: RewardRuleIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '删除积分奖励规则',
          },
        },
      ),
  { debugName: 'RewardRuleRoutes' },
);
