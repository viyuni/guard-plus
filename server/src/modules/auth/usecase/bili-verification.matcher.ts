import { type InferInput, ripple } from 'cyrenejs';

import { BiliPasswordResetRepo, BiliRegisterRepo } from '../repository';
import type { BiliRegisterRedisRepository } from '../repository';
import {
  BILI_PASSWORD_RESET_CODE_PREFIX,
  BILI_REGISTER_CODE_PREFIX,
  normalizeBiliVerificationCode,
} from './bili-register.usecase';

export interface BiliVerificationMessage {
  biliName?: string;
  biliUid: string;
  content: string;
}

interface BiliVerificationMatcherDeps {
  passwordResetRepo: BiliRegisterRedisRepository;
  registerRepo: BiliRegisterRedisRepository;
}

export function createBiliVerificationMatcher({
  passwordResetRepo,
  registerRepo,
}: BiliVerificationMatcherDeps) {
  return {
    async matchMessage(message: BiliVerificationMessage) {
      const code = normalizeBiliVerificationCode(message.content);
      const matchInput = [code, message.biliUid, message.biliName] as const;

      if (code.startsWith(BILI_REGISTER_CODE_PREFIX)) {
        return registerRepo.matchPending(...matchInput);
      }

      if (code.startsWith(BILI_PASSWORD_RESET_CODE_PREFIX)) {
        return passwordResetRepo.matchPending(...matchInput);
      }

      return null;
    },
  };
}

/** 将 B 站弹幕路由到对应的短生命周期验证码仓储。 */
export const BiliVerificationMatcher = ripple(
  {
    BiliPasswordResetRepo,
    BiliRegisterRepo,
  },
  deps =>
    createBiliVerificationMatcher({
      passwordResetRepo: deps.BiliPasswordResetRepo,
      registerRepo: deps.BiliRegisterRepo,
    }),
  { debugName: 'BiliVerificationMatcher' },
);

export type BiliVerificationMatcher = InferInput<typeof BiliVerificationMatcher>;
