import type { DashboardOverviewQuery } from '@shared/schema/dashboard';

export const DASHBOARD_QUERY_KEYS = {
  root: ['dashboard'] as const,
  overview: (query: DashboardOverviewQuery = {}) =>
    [...DASHBOARD_QUERY_KEYS.root, 'overview', query] as const,
};

export const dashboardOverviewQuery = defineQueryOptions((query: DashboardOverviewQuery = {}) => {
  const { $api } = useNuxtApp();

  return {
    key: DASHBOARD_QUERY_KEYS.overview(query),
    query: () => $api.dashboard.overview.get({ query }).then(res => res.data),
  };
});
