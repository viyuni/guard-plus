import {
  BiliEventIdParamsSchema,
  BiliEventPageQuerySchema,
  CreateManualBiliGuardEventSchema,
} from '@shared/schema/reward';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Reward from '#modules/reward';

import { AdminAuthGuard } from '../../auth';

export const RewardBiliGuardRoutes = ripple(
  {
    AdminAuthGuard,
    ManualRewardUseCase: Reward.ManualRewardUseCase,
    RewardQuery: Reward.RewardQuery,
    RewardReplayUseCase: Reward.RewardReplayUseCase,
  },
  ({ AdminAuthGuard, ManualRewardUseCase, RewardQuery, RewardReplayUseCase }) =>
    new Elysia({
      name: 'RewardBiliGuardRoute',
      prefix: '/biliGuard',
      detail: {
        tags: ['RewardBiliGuard'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        ({ query }) => {
          return RewardQuery.pageBiliGuardEvents(query);
        },
        {
          query: BiliEventPageQuerySchema,
          requiredAdminAuth: true,
          detail: {
            description: '大航海事件列表',
          },
        },
      )
      .post(
        '/manual',
        ({ body }) => {
          return ManualRewardUseCase.create(body);
        },
        {
          body: CreateManualBiliGuardEventSchema,
          requiredAdminAuth: true,
          detail: {
            description: '手动创建大航海事件并发放奖励',
          },
        },
      )
      .post(
        '/:biliEventId/replay',
        ({ params }) => {
          return RewardReplayUseCase.replayBiliGuardEvent(params.biliEventId);
        },
        {
          params: BiliEventIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '按事件快照回放大航海奖励',
          },
        },
      ),
  { debugName: 'RewardBiliGuardRoutes' },
);
