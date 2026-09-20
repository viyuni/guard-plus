import { ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import { imageUseCase } from '#modules/image/context';
import { pointTypeUseCase } from '#modules/point/context';

import { ProductRepository, StockMovementRepository } from './repository';
import { ProductUseCase, StockMovementUseCase } from './usecase';

export const productRepo = ripple({ db: Database }, ({ db }) => new ProductRepository(db), {
  debugName: 'ProductRepository',
});
export const stockMovementRepo = ripple(
  { db: Database },
  ({ db }) => new StockMovementRepository(db),
  { debugName: 'StockMovementRepository' },
);

export const productUseCase = ripple(
  { db: Database, pointTypeUseCase, productRepo, stockMovementRepo, imageUseCase },
  deps => new ProductUseCase(deps),
  { debugName: 'ProductUseCase' },
);
export const stockMovementUseCase = ripple(
  { stockMovementRepo },
  deps => new StockMovementUseCase(deps),
  { debugName: 'StockMovementUseCase' },
);
