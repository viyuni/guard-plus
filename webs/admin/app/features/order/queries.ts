import type { OrderPageQuery } from '@shared/schema/order';

export const ORDER_QUERY_KEYS = {
  root: ['orders'] as const,
  page: (query: OrderPageQuery = {}) => [...ORDER_QUERY_KEYS.root, 'page', query] as const,
};

export function normalizeOrderPageQuery(query: OrderPageQuery = {}) {
  return {
    ...query,
    keyword: query.keyword ?? '',
  };
}

export const orderPageQuery = defineQueryOptions((query: OrderPageQuery = {}) => {
  const requestQuery = normalizeOrderPageQuery(query);

  return {
    key: ORDER_QUERY_KEYS.page(query),
    query: () => api.orders.get({ query: requestQuery }).then(res => res.data),
  };
});
