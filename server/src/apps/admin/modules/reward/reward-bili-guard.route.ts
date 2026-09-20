import {
  BiliEventIdParamsSchema,
  BiliEventPageQuerySchema,
  CreateManualBiliGuardEventSchema,
} from '@shared/schema/reward';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AdminAuthGuard } from '#apps/admin/http';
import { RewardUseCase } from '#modules/reward';

export const RewardBiliGuardRoutes = ripple(
  {
    AdminAuthGuard,
    RewardUseCase,
  },
  ({ AdminAuthGuard, RewardUseCase }) =>
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
          return RewardUseCase.pageBiliGuardEvents(query);
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
          return RewardUseCase.createManualBiliGuardEvent(body);
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
          return RewardUseCase.replayRewardBiliGuard(params.biliEventId);
        },
        {
          params: BiliEventIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '按事件快照回放大航海奖励',
          },
        },
      ),
);
