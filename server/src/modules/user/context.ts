import type { DbClient } from '#db';

import { UserBasicInfoCrypto } from './domain';
import { UserRepository } from './repository';
import { UserUseCase } from './usecase';

export function createUserContext({ db, dataSecret }: { db: DbClient; dataSecret: string }) {
  const userBasicInfoCrypto = new UserBasicInfoCrypto(dataSecret);
  const userRepo = new UserRepository(db);
  const userUseCase = new UserUseCase({
    userBasicInfoCrypto,
    userRepo,
  });

  return {
    userBasicInfoCrypto,
    userRepo,
    userUseCase,
  };
}
