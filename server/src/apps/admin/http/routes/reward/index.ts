import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { RewardBiliGuardRoutes } from './bili-guard';
import { RewardRuleRoutes } from './rule';

export const RewardRoutes = ripple(
  {
    RewardBiliGuardRoutes,
    RewardRuleRoutes,
  },
  routes =>
    new Elysia({
      name: 'RewardRoute',
      prefix: '/rewards',
      detail: {
        tags: ['Reward'],
      },
    })
      .use(routes.RewardBiliGuardRoutes)
      .use(routes.RewardRuleRoutes),
  { debugName: 'RewardRoutes' },
);
