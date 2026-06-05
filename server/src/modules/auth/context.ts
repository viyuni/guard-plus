import type { RedisEnv } from '#env/redis';
import type { RedisClient } from '#redis';

import { AuthSessionRedisRepository, BiliRegisterRedisRepository } from './repository';
import { AuthUseCase, BiliRegisterUseCase } from './usecase';

export function createBiliRegisterContext({
  env,
  redis,
}: {
  env: Pick<RedisEnv, 'BILI_REGISTER_CODE_TTL_SECONDS'>;
  redis: RedisClient;
}) {
  const biliRegisterRepo = new BiliRegisterRedisRepository(
    redis,
    env.BILI_REGISTER_CODE_TTL_SECONDS,
  );
  const biliRegisterUseCase = new BiliRegisterUseCase({
    biliRegisterRepo,
    ttlSeconds: env.BILI_REGISTER_CODE_TTL_SECONDS,
  });

  return {
    biliRegisterRepo,
    biliRegisterUseCase,
  };
}

export function createAuthContext({
  env,
  redis,
}: {
  env: Pick<RedisEnv, 'BILI_REGISTER_CODE_TTL_SECONDS'> & {
    JWT_SECRET: string;
  };
  redis: RedisClient;
}) {
  const authSessionRepo = new AuthSessionRedisRepository(redis);
  const authUseCase = new AuthUseCase(env.JWT_SECRET, authSessionRepo);
  const biliRegister = createBiliRegisterContext({ env, redis });

  return {
    authSessionRepo,
    authUseCase,
    ...biliRegister,
  };
}
