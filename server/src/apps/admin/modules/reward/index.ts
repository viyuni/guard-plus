import Elysia from 'elysia';

import { appContext } from '../../context';
import { rewardBiliGuardRoute } from './reward-bili-guard.route';
import { rewardRuleRoute } from './reward-rule.route';

export const reward = new Elysia({
  name: 'RewardRoute',
  prefix: '/rewards',
  detail: {
    tags: ['Reward'],
  },
})
  .use(appContext)
  .use(rewardBiliGuardRoute)
  .use(rewardRuleRoute);
