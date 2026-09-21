import { defineRipples } from 'cyrenejs';

import { UserBasicInfoCrypto } from './domain';
import { UserRepo } from './repository';
import { UserUseCase } from './usecase';

// 静态领域 API
export * from './domain';
export type { UserRepository } from './repository';

/** user 模块的 Ripple Manifest。 */
export default defineRipples({
  UserBasicInfoCrypto,
  UserRepo,
  UserUseCase,
});
