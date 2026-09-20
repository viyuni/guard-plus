import { ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import { pointAccountRepo, pointBalanceUseCase, pointTypeUseCase } from '#modules/point/context';
import { productUseCase } from '#modules/product/context';
import { userBasicInfoCrypto, userUseCase } from '#modules/user/context';

import { OrderRepository } from './repository';
import { OrderUseCase } from './usecase';

export const orderRepo = ripple({ db: Database }, ({ db }) => new OrderRepository(db), {
  debugName: 'OrderRepository',
});

export const orderUseCase = ripple(
  {
    db: Database,
    orderRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    productUseCase,
    userBasicInfoCrypto,
    userUseCase,
  },
  deps => new OrderUseCase(deps),
  { debugName: 'OrderUseCase' },
);
