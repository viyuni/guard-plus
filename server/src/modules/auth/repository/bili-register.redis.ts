import type { RedisClient } from '#redis';

import type { BiliRegisterChallenge } from '../domain';
import biliRegisterScript from './bili-register.lua' with { type: 'text' };

export class BiliRegisterRedisRepository {
  constructor(
    private readonly redis: RedisClient,
    private readonly ttlSeconds: number,
  ) {}

  private key(code: string) {
    return `bili-register:user:code:${code}`;
  }

  /**
   * 占用新生成的注册码。NX 可以避免并发请求碰巧生成相同短码时，
   * 两个验证流程共用同一个注册码。
   */
  async create(challenge: BiliRegisterChallenge) {
    const result = await this.redis.set(this.key(challenge.code), JSON.stringify(challenge), {
      expiration: {
        type: 'EX',
        value: this.ttlSeconds,
      },
      condition: 'NX',
    });

    return result === 'OK';
  }

  async find(code: string) {
    const raw = await this.redis.get(this.key(code));

    if (!raw) return null;

    return JSON.parse(raw) as BiliRegisterChallenge;
  }

  /**
   * 收到匹配的 B 站弹幕后，原子地更新待验证注册码。
   * 使用 Lua 可以避免并发消息互相覆盖。
   */
  async matchPending(code: string, biliUid: string, biliName: string | undefined) {
    const raw = await this.redis.eval(biliRegisterScript, {
      keys: [this.key(code)],
      arguments: ['match', biliUid, biliName ?? '', new Date().toISOString()],
    });

    if (!raw || typeof raw !== 'string') return null;

    return JSON.parse(raw) as BiliRegisterChallenge;
  }

  /**
   * 原子地消费已匹配的注册码。脚本会验证归属，并返回消费前的数据，
   * 供注册流程读取已验证的 B 站身份。
   */
  async consumeMatched(code: string, verifierHash: string) {
    const raw = await this.redis.eval(biliRegisterScript, {
      keys: [this.key(code)],
      arguments: ['consume', verifierHash, new Date().toISOString()],
    });

    if (!raw || typeof raw !== 'string') return null;

    return JSON.parse(raw) as BiliRegisterChallenge;
  }
}
