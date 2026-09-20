import { ripple } from 'cyrenejs';

import { Database, DataSecret } from '#context/tokens';

import { UserBasicInfoCrypto } from './domain';
import { UserRepository } from './repository';
import { UserUseCase } from './usecase';

export const userBasicInfoCrypto = ripple(
  { dataSecret: DataSecret },
  ({ dataSecret }) => new UserBasicInfoCrypto(dataSecret),
  { debugName: 'UserBasicInfoCrypto' },
);
export const userRepo = ripple({ db: Database }, ({ db }) => new UserRepository(db), {
  debugName: 'UserRepository',
});
export const userUseCase = ripple(
  { userBasicInfoCrypto, userRepo },
  deps => new UserUseCase(deps),
  { debugName: 'UserUseCase' },
);
