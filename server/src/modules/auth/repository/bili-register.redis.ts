import { type InferInput, ripple } from 'cyrenejs';

import { Redis } from '#context/tokens';
import { RegisterCodeTtl } from '#env/bili';
import type { RedisClient } from '#redis';

import type { BiliRegisterChallenge } from '../domain';
import biliRegisterScript from './bili-register.lua' with { type: 'text' };

interface BiliRegisterRedisRepositoryDeps {
  purpose: 'register' | 'password-reset';
  redis: RedisClient;
  ttlSeconds: number;
}

function createBiliRegisterRedisRepository({
  purpose,
  redis,
  ttlSeconds,
}: BiliRegisterRedisRepositoryDeps) {
  function key(biliUid: string, code: string) {
    return `bili-verification:${purpose}:user:uid:${biliUid}:code:${code}`;
  }

  return {
    /**
     * 占用新生成的注册码。NX 可以避免并发请求碰巧生成相同短码时，
     * 两个验证流程共用同一个注册码。
     */
    async create(challenge: BiliRegisterChallenge) {
      const result = await redis.set(
        key(challenge.expectedBiliUid, challenge.code),
        JSON.stringify(challenge),
        {
          expiration: {
            type: 'EX',
            value: ttlSeconds,
          },
          condition: 'NX',
        },
      );

      return result === 'OK';
    },

    async find(code: string, biliUid: string) {
      const raw = await redis.get(key(biliUid, code));

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as BiliRegisterChallenge;
    },

    /**
     * 收到匹配的 B 站弹幕后，原子地更新待验证注册码。
     * 使用 Lua 可以避免并发消息互相覆盖。
     */
    async matchPending(code: string, biliUid: string, biliName: string | undefined) {
      const raw = await redis.eval(biliRegisterScript, {
        keys: [key(biliUid, code)],
        arguments: ['match', biliUid, biliName ?? '', new Date().toISOString()],
      });

      if (!raw || typeof raw !== 'string') {
        return null;
      }

      return JSON.parse(raw) as BiliRegisterChallenge;
    },

    /**
     * 原子地消费已匹配的注册码。脚本会验证归属，并返回消费前的数据，
     * 供注册流程读取已验证的 B 站身份。
     */
    async consumeMatched(code: string, biliUid: string, verifierHash: string) {
      const raw = await redis.eval(biliRegisterScript, {
        keys: [key(biliUid, code)],
        arguments: ['consume', verifierHash, biliUid, new Date().toISOString()],
      });

      if (!raw || typeof raw !== 'string') {
        return null;
      }

      return JSON.parse(raw) as BiliRegisterChallenge;
    },
  };
}

export const biliRegisterRepo = ripple(
  {
    redis: Redis,
    ttlSeconds: RegisterCodeTtl,
  },
  deps => createBiliRegisterRedisRepository({ ...deps, purpose: 'register' }),
  { debugName: 'BiliRegisterRepository' },
);

export const biliPasswordResetRepo = ripple(
  {
    redis: Redis,
    ttlSeconds: RegisterCodeTtl,
  },
  deps => createBiliRegisterRedisRepository({ ...deps, purpose: 'password-reset' }),
  { debugName: 'BiliPasswordResetRepository' },
);

export type BiliRegisterRedisRepository = InferInput<typeof biliRegisterRepo>;
