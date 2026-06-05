import type { UserPageQuery } from '@shared/schema/user';

export const USER_QUERY_KEYS = {
  root: ['users'] as const,
  page: (query: UserPageQuery = {}) => [...USER_QUERY_KEYS.root, 'page', query] as const,
};

export const userPageQuery = defineQueryOptions((query: UserPageQuery = {}) => {
  const { $api } = useNuxtApp();

  return {
    key: USER_QUERY_KEYS.page(query),
    query: () => $api.users.get({ query }).then(res => res.data),
  };
});
