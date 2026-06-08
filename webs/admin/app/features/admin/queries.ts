import type { AdminPageQuery } from '@shared/schema/admin';

export const ADMIN_QUERY_KEYS = {
  root: ['admins'] as const,
  page: (query: AdminPageQuery = {}) => [...ADMIN_QUERY_KEYS.root, 'page', query] as const,
};

export const adminPageQuery = defineQueryOptions((query: AdminPageQuery = {}) => {
  return {
    key: ADMIN_QUERY_KEYS.page(query),
    query: () => api.admin.get({ query }).then(res => res.data),
  };
});
