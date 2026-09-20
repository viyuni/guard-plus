import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { rewardBiliGuardRoutes } from './reward-bili-guard.route';
import { rewardRuleRoutes } from './reward-rule.route';

export const rewardRoutes = ripple(
  {
    rewardBiliGuardRoutes,
    rewardRuleRoutes,
  },
  routes =>
    new Elysia({
      name: 'RewardRoute',
      prefix: '/rewards',
      detail: {
        tags: ['Reward'],
      },
    })
      .use(routes.rewardBiliGuardRoutes)
      .use(routes.rewardRuleRoutes),
);
