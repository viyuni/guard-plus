import type { DbClient } from '#db';
import type { PointAccountRepository, PointBalanceUseCase, PointTypeUseCase } from '#modules/point';
import type { ProductUseCase } from '#modules/product';
import type { UserBasicInfoCrypto, UserUseCase } from '#modules/user';

import { OrderRepository } from './repository';
import { OrderUseCase } from './usecase';

export function createOrderContext({
  db,
  pointAccountRepo,
  pointBalanceUseCase,
  pointTypeUseCase,
  productUseCase,
  userBasicInfoCrypto,
  userUseCase,
}: {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTypeUseCase: PointTypeUseCase;
  productUseCase: ProductUseCase;
  userBasicInfoCrypto: UserBasicInfoCrypto;
  userUseCase: UserUseCase;
}) {
  const orderRepo = new OrderRepository(db);
  const orderUseCase = new OrderUseCase({
    db,
    orderRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    productUseCase,
    userBasicInfoCrypto,
    userUseCase,
  });

  return {
    orderRepo,
    orderUseCase,
  };
}
