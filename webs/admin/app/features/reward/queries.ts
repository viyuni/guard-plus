import type { BiliEventPageQuery } from '@shared/schema/reward';

export const REWARD_QUERY_KEYS = {
  root: ['rewards'] as const,
  rules: () => [...REWARD_QUERY_KEYS.root, 'rules'] as const,
  biliGuardEvents: (query: BiliEventPageQuery = {}) =>
    [...REWARD_QUERY_KEYS.root, 'biliGuardEvents', query] as const,
};

export const rewardRuleListQuery = defineQueryOptions(() => {
  return {
    key: REWARD_QUERY_KEYS.rules(),
    query: () => api.rewards.rules.get().then(res => res.data),
  };
});

export const biliGuardEventPageQuery = defineQueryOptions((query: BiliEventPageQuery = {}) => {
  return {
    key: REWARD_QUERY_KEYS.biliGuardEvents(query),
    query: () => api.rewards.biliGuard.get({ query }).then(res => res.data),
  };
});
