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
const createdKeys = new Set<string>();

function redisKey(biliUid: string, code: string, purpose = 'register') {
  return `bili-verification:${purpose}:user:uid:${biliUid}:code:${code}`;
}

function hashVerifier(verifier: string) {
  return createHash('sha256').update(verifier).digest('hex');
}

async function createMatchedChallenge() {
  const biliUid = `uid-${crypto.randomUUID()}`;
  const { challenge, verifier } = await useCase.createChallenge(biliUid);
  createdKeys.add(redisKey(biliUid, challenge.code));

  expect(challenge.code).toStartWith(BiliRegisterUseCase.codePrefix);

  const matched = await useCase.matchMessage({
    code: challenge.code.toLowerCase(),
    biliUid,
    biliName: 'tester',
  });

  expect(matched?.status).toBe('matched');

  return {
    code: challenge.code,
    verifier,
    biliUid,
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
    for (const key of createdKeys) {
      await redis.del(key);
    }
  } finally {
    createdKeys.clear();
    await redis.close();
  }
});

describeWithRedis('BiliRegisterRedisRepository 真实 Redis', () => {
  it('只允许待验证 UID 对应的弹幕匹配注册码', async () => {
    const expectedBiliUid = `uid-${crypto.randomUUID()}`;
    const { challenge } = await useCase.createChallenge(expectedBiliUid);
    createdKeys.add(redisKey(expectedBiliUid, challenge.code));

    const mismatched = await useCase.matchMessage({
      code: challenge.code,
      biliUid: `uid-${crypto.randomUUID()}`,
      biliName: 'attacker',
    });

    expect(mismatched).toBeNull();
    expect(await repo.find(challenge.code, expectedBiliUid)).toMatchObject({
      status: 'pending',
      expectedBiliUid,
    });

    const matched = await useCase.matchMessage({
      code: challenge.code,
      biliUid: expectedBiliUid,
      biliName: 'tester',
    });

    expect(matched).toMatchObject({
      status: 'matched',
      expectedBiliUid,
      biliUid: expectedBiliUid,
    });
  });

  it('拒绝错误 verifier 消费，且不会破坏原注册码', async () => {
    const { code, verifier, biliUid } = await createMatchedChallenge();

    const stolen = await useCase.consumeChallenge(code, 'stolen-verifier', biliUid);
    const afterStolenAttempt = await repo.find(code, biliUid);

    expect(stolen).toBeNull();
    expect(afterStolenAttempt).toMatchObject({
      status: 'matched',
      code,
    });

    const consumed = await useCase.consumeChallenge(code, verifier, biliUid);
    const stored = await repo.find(code, biliUid);

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
    const { code, verifier, biliUid } = await createMatchedChallenge();
    const verifierHash = hashVerifier(verifier);

    const results = await Promise.all(
      Array.from({ length: 4 }, () => repo.consumeMatched(code, biliUid, verifierHash)),
    );

    const successes = results.filter(Boolean);
    const stored = await repo.find(code, biliUid);

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
    const { challenge, verifier } = await useCase.createChallenge('123456');
    createdKeys.add(redisKey(challenge.expectedBiliUid, challenge.code));

    const pendingConsumed = await useCase.consumeChallenge(
      challenge.code,
      verifier,
      challenge.expectedBiliUid,
    );

    expect(pendingConsumed).toBeNull();

    await redis.set(
      redisKey(challenge.expectedBiliUid, challenge.code),
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

    const missingIdentityConsumed = await useCase.consumeChallenge(
      challenge.code,
      verifier,
      challenge.expectedBiliUid,
    );
    const stored = await repo.find(challenge.code, challenge.expectedBiliUid);

    expect(missingIdentityConsumed).toBeNull();
    expect(stored).toMatchObject({
      status: 'matched',
      code: challenge.code,
    });
  });

  it('注册与密码重置使用独立 Redis key，不能跨流程读取', async () => {
    const biliUid = `uid-${crypto.randomUUID()}`;
    const resetRepo = new BiliRegisterRedisRepository(redis, ttlSeconds, 'password-reset');
    const resetUseCase = new BiliRegisterUseCase({
      biliRegisterRepo: resetRepo,
      codePrefix: 'P-',
      ttlSeconds,
    });
    const { challenge } = await resetUseCase.createChallenge(biliUid);
    createdKeys.add(redisKey(biliUid, challenge.code, 'password-reset'));

    expect(challenge.code).toStartWith('P-');
    expect(await resetRepo.find(challenge.code, biliUid)).not.toBeNull();
    expect(await repo.find(challenge.code, biliUid)).toBeNull();
  });
});
