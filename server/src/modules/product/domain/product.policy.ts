import type { Product } from '#infrastructure/db/schema';

import { ProductUnavailableError } from './errors';

export type AvailableProduct = Product & {
  status: 'active';
};

export function isProductAvailable(
  product: Product | null | undefined,
  now = new Date(),
): product is AvailableProduct {
  if (product?.status !== 'active') {
    return false;
  }

  if (product.startAt && product.startAt > now) {
    return false;
  }

  if (product.endAt && product.endAt <= now) {
    return false;
  }

  return true;
}

export function assertProductAvailable(
  product: Product | null | undefined,
): asserts product is AvailableProduct {
  if (!isProductAvailable(product)) {
    throw new ProductUnavailableError();
  }
}

export function shouldActivateProduct(product: Product) {
  return product.status !== 'active';
}

export function shouldDisableProduct(product: Product) {
  return product.status !== 'disabled';
}
