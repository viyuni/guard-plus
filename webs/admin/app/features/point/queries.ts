import type { PointTransactionPageQuery } from '@shared/schema/point-transaction';

export const POINT_QUERY_KEYS = {
  root: ['points'] as const,
  types: () => [...POINT_QUERY_KEYS.root, 'types'] as const,
  transactions: (query: PointTransactionPageQuery = {}) =>
    [...POINT_QUERY_KEYS.root, 'transactions', query] as const,
  conversions: () => [...POINT_QUERY_KEYS.root, 'conversions'] as const,
};

export const pointTypeListQuery = defineQueryOptions(() => {
  return {
    key: POINT_QUERY_KEYS.types(),
    query: () => api.points.types.get().then(res => res.data),
  };
});

export const pointTransactionPageQuery = defineQueryOptions(
  (query: PointTransactionPageQuery = {}) => {
    return {
      key: POINT_QUERY_KEYS.transactions(query),
      query: () => api.points.transactions.get({ query }).then(res => res.data),
    };
  },
);

export const pointConversionListQuery = defineQueryOptions(() => {
  return {
    key: POINT_QUERY_KEYS.conversions(),
    query: () => api.points.conversions.get().then(res => res.data),
  };
});
