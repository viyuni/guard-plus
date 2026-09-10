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
      codePrefix?: string;
      ttlSeconds: number;
    },
  ) {}

  async createChallenge(expectedBiliUid: string) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `${this.codePrefix}${createCodeSuffix()}`;
      const verifier = createVerifier();
      const now = Date.now();
      const challenge: BiliRegisterChallenge = {
        status: 'pending',
        code,
        verifierHash: this.hashVerifier(verifier),
        expectedBiliUid,
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

  async getChallenge(code: string, biliUid: string) {
    return this.deps.biliRegisterRepo.find(this.normalizeCode(code), biliUid);
  }

  async getOwnedChallenge(code: string | undefined, verifier: string | undefined, biliUid: string) {
    if (!code || !verifier) return null;

    const normalizedCode = this.normalizeCode(code);
    const challenge = await this.getChallenge(normalizedCode, biliUid);

    if (
      !challenge ||
      challenge.code !== normalizedCode ||
      challenge.verifierHash !== this.hashVerifier(verifier)
    ) {
      return null;
    }

    return challenge;
  }

  async matchMessage(input: BiliRegisterMatchInput) {
    const code = this.normalizeCode(input.code);

    if (!code.startsWith(this.codePrefix)) {
      return null;
    }

    return this.deps.biliRegisterRepo.matchPending(code, input.biliUid, input.biliName);
  }

  async consumeChallenge(code: string, verifier: string | undefined, biliUid: string) {
    if (!verifier) return null;

    return this.deps.biliRegisterRepo.consumeMatched(
      this.normalizeCode(code),
      biliUid,
      this.hashVerifier(verifier),
    );
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private hashVerifier(verifier: string) {
    return createHash('sha256').update(verifier).digest('hex');
  }

  private get codePrefix() {
    return this.deps.codePrefix ?? BiliRegisterUseCase.codePrefix;
  }
}
