import type { ProductPageQuery } from '@shared/schema/product';
import type { StockMovementPageQuery } from '@shared/schema/stock';

export const PRODUCT_QUERY_KEYS = {
  root: ['products'] as const,
  page: (query: ProductPageQuery = {}) => [...PRODUCT_QUERY_KEYS.root, 'page', query] as const,
  stockMovements: (query: StockMovementPageQuery = {}) =>
    [...PRODUCT_QUERY_KEYS.root, 'stockMovements', query] as const,
};

export const productPageQuery = defineQueryOptions((query: ProductPageQuery = {}) => {
  return {
    key: PRODUCT_QUERY_KEYS.page(query),
    query: () => api.products.get({ query }).then(res => res.data),
  };
});

export const stockMovementPageQuery = defineQueryOptions((query: StockMovementPageQuery = {}) => {
  return {
    key: PRODUCT_QUERY_KEYS.stockMovements(query),
    query: () => api.products.stock.movements.get({ query }).then(res => res.data),
  };
});
