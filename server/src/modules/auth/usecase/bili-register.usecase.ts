import { createHash } from 'node:crypto';

import { customAlphabet } from 'nanoid';

import type { BiliRegisterChallenge } from '../domain';
import type { BiliRegisterRedisRepository } from '../repository';

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

export class BiliRegisterUseCase {
  static readonly codePrefix = 'V-';

  constructor(
    private readonly deps: {
      biliRegisterRepo: BiliRegisterRedisRepository;
      ttlSeconds: number;
    },
  ) {}

  async createChallenge() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `${BiliRegisterUseCase.codePrefix}${createCodeSuffix()}`;
      const verifier = createVerifier();
      const now = Date.now();
      const challenge: BiliRegisterChallenge = {
        status: 'pending',
        code,
        verifierHash: this.hashVerifier(verifier),
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + this.deps.ttlSeconds * 1000).toISOString(),
      };

      if (await this.deps.biliRegisterRepo.create(challenge)) {
        return {
          challenge,
          verifier,
        };
      }
    }

    throw new Error('生成注册码失败，请稍后再试');
  }

  async getChallenge(code: string) {
    return this.deps.biliRegisterRepo.find(this.normalizeCode(code));
  }

  async getOwnedChallenge(code: string, verifier: string | undefined) {
    if (!verifier) return null;

    const challenge = await this.getChallenge(code);

    if (!challenge || challenge.verifierHash !== this.hashVerifier(verifier)) {
      return null;
    }

    return challenge;
  }

  async matchMessage(input: BiliRegisterMatchInput) {
    const code = this.normalizeCode(input.code);

    if (!code.startsWith(BiliRegisterUseCase.codePrefix)) {
      return null;
    }

    return this.deps.biliRegisterRepo.matchPending(code, input.biliUid, input.biliName);
  }

  async consumeChallenge(code: string, verifier: string | undefined) {
    if (!verifier) return null;

    return this.deps.biliRegisterRepo.consumeMatched(
      this.normalizeCode(code),
      this.hashVerifier(verifier),
    );
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private hashVerifier(verifier: string) {
    return createHash('sha256').update(verifier).digest('hex');
  }
}
