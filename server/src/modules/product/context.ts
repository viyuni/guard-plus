import type { DbClient } from '#db';
import type { ImageUseCase } from '#modules/image';
import type { PointTypeUseCase } from '#modules/point';

import { ProductRepository, StockMovementRepository } from './repository';
import { ProductUseCase, StockMovementUseCase } from './usecase';

export function createProductContext({
  db,
  imageUseCase,
  pointTypeUseCase,
}: {
  db: DbClient;
  imageUseCase: ImageUseCase;
  pointTypeUseCase: PointTypeUseCase;
}) {
  const productRepo = new ProductRepository(db);
  const stockMovementRepo = new StockMovementRepository(db);
  const productUseCase = new ProductUseCase({
    db,
    pointTypeUseCase,
    productRepo,
    stockMovementRepo,
    imageUseCase,
  });
  const stockMovementUseCase = new StockMovementUseCase({
    stockMovementRepo,
  });

  return {
    productRepo,
    stockMovementRepo,
    productUseCase,
    stockMovementUseCase,
  };
}
