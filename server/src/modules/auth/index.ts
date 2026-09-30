import { AuthSessionRepo, BiliPasswordResetRepo, BiliRegisterRepo } from './repository';
import {
  createAuthUseCase,
  type AuthDependencies,
  BiliPasswordResetUseCase,
  BiliRegisterUseCase,
  BiliVerificationMatcher,
} from './usecase';

export {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  BILI_REGISTER_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from './constants';
export type {
  AuthPayload,
  AuthRole,
  AuthSession,
  AuthTokenPair,
  BiliRegisterChallenge,
} from './domain';

/** 不依赖 JWT 密钥的共享认证能力，供事件进程使用。 */
const Auth = {
  AuthSessionRepo,
  BiliRegisterRepo,
  BiliPasswordResetRepo,
  BiliRegisterUseCase,
  BiliPasswordResetUseCase,
  BiliVerificationMatcher,
};

export default Auth;

export function createAuth<const Key extends string>(key: Key, dependencies: AuthDependencies) {
  return {
    ...Auth,
    AuthUseCase: createAuthUseCase(key, dependencies),
  };
}
