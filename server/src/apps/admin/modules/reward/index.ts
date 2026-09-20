import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { RewardBiliGuardRoutes } from './reward-bili-guard.route';
import { RewardRuleRoutes } from './reward-rule.route';

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
);
