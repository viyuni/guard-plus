import { defineRipples } from 'cyrenejs';

import { AuthSessionRepo, BiliPasswordResetRepo, BiliRegisterRepo } from './repository';
import { AuthUseCase, BiliPasswordResetUseCase, BiliRegisterUseCase } from './usecase';

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

/**
 * 认证模块的 Ripple Manifest。
 *
 * injectable 能力只通过默认导出暴露；具名导出只提供静态领域 API。
 */
export default defineRipples({
  AuthSessionRepo,
  BiliRegisterRepo,
  BiliPasswordResetRepo,
  AuthUseCase,
  BiliRegisterUseCase,
  BiliPasswordResetUseCase,
});
