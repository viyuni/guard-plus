import { ripple } from 'cyrenejs';

import { Redis, RegisterCodeTtl, JwtSecret } from '#context/tokens';

import { AuthSessionRedisRepository, BiliRegisterRedisRepository } from './repository';
import { AuthUseCase, BiliRegisterUseCase } from './usecase';

export const authSessionRepo = ripple(
  { redis: Redis },
  ({ redis }) => new AuthSessionRedisRepository(redis),
  { debugName: 'AuthSessionRepository' },
);
export const authUseCase = ripple(
  { jwtSecret: JwtSecret, authSessionRepo },
  ({ jwtSecret, authSessionRepo }) => new AuthUseCase(jwtSecret, authSessionRepo),
  { debugName: 'AuthUseCase' },
);

export const biliRegisterRepo = ripple(
  { redis: Redis, ttlSeconds: RegisterCodeTtl },
  ({ redis, ttlSeconds }) => new BiliRegisterRedisRepository(redis, ttlSeconds),
  { debugName: 'BiliRegisterRepository' },
);
export const biliRegisterUseCase = ripple(
  { biliRegisterRepo, ttlSeconds: RegisterCodeTtl },
  deps => new BiliRegisterUseCase(deps),
  { debugName: 'BiliRegisterUseCase' },
);

export const biliPasswordResetRepo = ripple(
  { redis: Redis, ttlSeconds: RegisterCodeTtl },
  ({ redis, ttlSeconds }) => new BiliRegisterRedisRepository(redis, ttlSeconds, 'password-reset'),
  { debugName: 'BiliPasswordResetRepository' },
);
export const biliPasswordResetUseCase = ripple(
  {
    biliRegisterRepo: biliPasswordResetRepo,
    ttlSeconds: RegisterCodeTtl,
  },
  deps => new BiliRegisterUseCase({ ...deps, codePrefix: 'P-' }),
  { debugName: 'BiliPasswordResetUseCase' },
);
