import { createHash } from 'node:crypto';

import { type InferInput, ripple } from 'cyrenejs';
import { customAlphabet } from 'nanoid';

import { RegisterCodeTtl } from '#env/bili';

import type { BiliRegisterChallenge } from '../domain';
import { biliPasswordResetRepo, biliRegisterRepo } from '../repository';
import type { BiliRegisterRedisRepository } from '../repository';

/** 新用户注册验证码前缀 */
export const BILI_REGISTER_CODE_PREFIX = 'V-';

/** 密码重置验证码前缀 */
export const BILI_PASSWORD_RESET_CODE_PREFIX = 'P-';

const createCodeSuffix = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

const createVerifier = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  48,
);

export interface BiliRegisterMatchInput {
  code: string;
  biliUid: string;
  biliName?: string;
}

interface BiliRegisterUseCaseDeps {
  biliRegisterRepo: BiliRegisterRedisRepository;
  codePrefix: string;
  ttlSeconds: number;
}

/**
 * 注册与密码重置共用同一套弹幕验证流程, 仅验证码前缀不同,
 * 因此两个 provider 共享这份实现。
 */
function createBiliRegisterUseCase({
  biliRegisterRepo,
  codePrefix,
  ttlSeconds,
}: BiliRegisterUseCaseDeps) {
  function normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  function hashVerifier(verifier: string) {
    return createHash('sha256').update(verifier).digest('hex');
  }

  async function getChallenge(code: string, biliUid: string) {
    return biliRegisterRepo.find(normalizeCode(code), biliUid);
  }

  return {
    async createChallenge(expectedBiliUid: string) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = `${codePrefix}${createCodeSuffix()}`;
        const verifier = createVerifier();
        const now = Date.now();

        const challenge: BiliRegisterChallenge = {
          status: 'pending',
          code,
          verifierHash: hashVerifier(verifier),
          expectedBiliUid,
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
        };

        if (await biliRegisterRepo.create(challenge)) {
          return {
            challenge,
            verifier,
          };
        }
      }

      throw new Error('生成注册码失败，请稍后再试');
    },

    getChallenge,

    async getOwnedChallenge(
      code: string | undefined,
      verifier: string | undefined,
      biliUid: string,
    ) {
      if (!code || !verifier) {
        return null;
      }

      const normalizedCode = normalizeCode(code);
      const challenge = await getChallenge(normalizedCode, biliUid);

      if (
        !challenge ||
        challenge.code !== normalizedCode ||
        challenge.verifierHash !== hashVerifier(verifier)
      ) {
        return null;
      }

      return challenge;
    },

    async matchMessage(input: BiliRegisterMatchInput) {
      const code = normalizeCode(input.code);

      if (!code.startsWith(codePrefix)) {
        return null;
      }

      return biliRegisterRepo.matchPending(code, input.biliUid, input.biliName);
    },

    async consumeChallenge(code: string, verifier: string | undefined, biliUid: string) {
      if (!verifier) {
        return null;
      }

      return biliRegisterRepo.consumeMatched(normalizeCode(code), biliUid, hashVerifier(verifier));
    },
  };
}

export const biliRegisterUseCase = ripple(
  {
    biliRegisterRepo,
    ttlSeconds: RegisterCodeTtl,
  },
  deps => createBiliRegisterUseCase({ ...deps, codePrefix: BILI_REGISTER_CODE_PREFIX }),
  { debugName: 'BiliRegisterUseCase' },
);

export const biliPasswordResetUseCase = ripple(
  {
    biliRegisterRepo: biliPasswordResetRepo,
    ttlSeconds: RegisterCodeTtl,
  },
  deps => createBiliRegisterUseCase({ ...deps, codePrefix: BILI_PASSWORD_RESET_CODE_PREFIX }),
  { debugName: 'BiliPasswordResetUseCase' },
);

export type BiliRegisterUseCase = InferInput<typeof biliRegisterUseCase>;
