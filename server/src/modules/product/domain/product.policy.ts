import type { Product } from '#db/schema';

import { ProductUnavailableError } from './errors';

export type AvailableProduct = Product & {
  status: 'active';
};

export class ProductPolicy {
  static isAvailable(
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

  static assertAvailable(product: Product | null | undefined): asserts product is AvailableProduct {
    if (!ProductPolicy.isAvailable(product)) {
      throw new ProductUnavailableError();
    }
  }

  static shouldActivate(product: Product) {
    return product.status !== 'active';
  }

  static shouldDisable(product: Product) {
    return product.status !== 'disabled';
  }
}
