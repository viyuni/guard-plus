import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';

import { createClient } from 'redis';

import type { RedisClient } from '#redis';

import { BiliRegisterRedisRepository } from '../repository';
import { BiliRegisterUseCase } from '../usecase/bili-register.usecase';

const testRedisUrl = Bun.env.TEST_REDIS_URL;
const describeWithRedis = testRedisUrl ? describe : describe.skip;
const ttlSeconds = 60;

let redis: RedisClient;
let repo: BiliRegisterRedisRepository;
let useCase: BiliRegisterUseCase;
const createdCodes = new Set<string>();

function hashVerifier(verifier: string) {
  return createHash('sha256').update(verifier).digest('hex');
}

async function createMatchedChallenge() {
  const { challenge, verifier } = await useCase.createChallenge();
  createdCodes.add(challenge.code);

  expect(challenge.code).toStartWith(BiliRegisterUseCase.codePrefix);

  const matched = await useCase.matchMessage({
    code: challenge.code.toLowerCase(),
    biliUid: `uid-${crypto.randomUUID()}`,
    biliName: 'tester',
  });

  expect(matched?.status).toBe('matched');

  return {
    code: challenge.code,
    verifier,
  };
}

beforeEach(async () => {
  if (!testRedisUrl) return;

  redis = createClient({ url: testRedisUrl });
  await redis.connect();

  repo = new BiliRegisterRedisRepository(redis, ttlSeconds);
  useCase = new BiliRegisterUseCase({
    biliRegisterRepo: repo,
    ttlSeconds,
  });
});

afterEach(async () => {
  if (!redis) return;

  try {
    for (const code of createdCodes) {
      await redis.del(`bili-register:user:code:${code}`);
    }
  } finally {
    createdCodes.clear();
    await redis.close();
  }
});

describeWithRedis('BiliRegisterRedisRepository 真实 Redis', () => {
  it('拒绝错误 verifier 消费，且不会破坏原注册码', async () => {
    const { code, verifier } = await createMatchedChallenge();

    const stolen = await useCase.consumeChallenge(code, 'stolen-verifier');
    const afterStolenAttempt = await repo.find(code);

    expect(stolen).toBeNull();
    expect(afterStolenAttempt).toMatchObject({
      status: 'matched',
      code,
    });

    const consumed = await useCase.consumeChallenge(code, verifier);
    const stored = await repo.find(code);

    expect(consumed).toMatchObject({
      status: 'matched',
      code,
    });
    expect(stored).toMatchObject({
      status: 'consumed',
      code,
    });
    expect(stored?.consumedAt).toBeString();
  });

  it('并发重复消费时只有一个请求成功', async () => {
    const { code, verifier } = await createMatchedChallenge();
    const verifierHash = hashVerifier(verifier);

    const results = await Promise.all(
      Array.from({ length: 4 }, () => repo.consumeMatched(code, verifierHash)),
    );

    const successes = results.filter(Boolean);
    const stored = await repo.find(code);

    expect(successes).toHaveLength(1);
    expect(successes[0]).toMatchObject({
      status: 'matched',
      code,
    });
    expect(stored).toMatchObject({
      status: 'consumed',
      code,
    });
    expect(stored?.consumedAt).toBeString();
  });

  it('不能消费未匹配或缺少 B 站身份的注册码', async () => {
    const { challenge, verifier } = await useCase.createChallenge();
    createdCodes.add(challenge.code);

    const pendingConsumed = await useCase.consumeChallenge(challenge.code, verifier);

    expect(pendingConsumed).toBeNull();

    await redis.set(
      `bili-register:user:code:${challenge.code}`,
      JSON.stringify({
        ...challenge,
        status: 'matched',
        matchedAt: new Date().toISOString(),
      }),
      {
        expiration: {
          type: 'EX',
          value: ttlSeconds,
        },
      },
    );

    const missingIdentityConsumed = await useCase.consumeChallenge(challenge.code, verifier);
    const stored = await repo.find(challenge.code);

    expect(missingIdentityConsumed).toBeNull();
    expect(stored).toMatchObject({
      status: 'matched',
      code: challenge.code,
    });
  });
});
