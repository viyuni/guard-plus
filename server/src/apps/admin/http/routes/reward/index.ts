import { ripple } from 'cyrenex';
import Elysia from 'elysia';

import { RewardBiliGuardRoutes } from './bili-guard';
import { RewardRuleRoutes } from './rule';

export const RewardRoutes = ripple(
  'RewardRoutes',
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
);
