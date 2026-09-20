import { afterEach, expect, it, spyOn } from 'bun:test';

import type { DbClient } from '#db';
import { biliPasswordResetUseCase, biliRegisterUseCase } from '#modules/auth';
import type { BiliRegisterChallenge } from '#modules/auth/domain';
import { pointAccountUseCase } from '#modules/point';
import { rewardUseCase } from '#modules/reward';
import { userUseCase } from '#modules/user';
import { createTestRuntime } from '#test-helpers/test-runtime';
import { BadRequestError } from '#utils';

import { userAuthUseCase } from '../usecase';

const input = {
  biliUid: '123456',
  username: 'tester',
  password: 'test_password',
};

const credential = {
  code: 'U-234567',
  verifier: 'verifier',
};

const runtimes: Array<{ dispose: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(runtimes.splice(0).map(runtime => runtime.dispose()));
});

async function createUseCase(
  challenge: BiliRegisterChallenge | null,
  options: {
    consumeError?: Error;
    migrationError?: Error;
    passwordResetChallenge?: BiliRegisterChallenge | null;
    rewardError?: Error;
  } = {},
) {
  const tx = {};

  const runtime = createTestRuntime(
    { userAuthUseCase },
    {
      database: {
        transaction: async (callback: (actualTx: unknown) => unknown) => callback(tx),
      } as unknown as DbClient,
    },
  );

  runtimes.push(runtime);

  const container = await runtime.start();

  const create = spyOn(await runtime.resolve(userUseCase), 'create').mockImplementation(
    async () =>
      ({
        id: 'user-id',
        biliUid: input.biliUid,
        username: input.username,
      }) as never,
  );

  const replayRewardBiliGuardByUserId = spyOn(
    await runtime.resolve(rewardUseCase),
    'replayRewardBiliGuardByUserId',
  ).mockImplementation(async () => {
    if (options.rewardError) {
      throw options.rewardError;
    }

    return undefined as never;
  });

  const replayLegacyMigrations = spyOn(
    await runtime.resolve(pointAccountUseCase),
    'replayLegacyMigrations',
  ).mockImplementation(async () => {
    if (options.migrationError) {
      throw options.migrationError;
    }

    return [];
  });

  const registerUseCase = await runtime.resolve(biliRegisterUseCase);
  const resetUseCase = await runtime.resolve(biliPasswordResetUseCase);

  const getOwnedChallenge = spyOn(registerUseCase, 'getOwnedChallenge').mockImplementation(
    async () => challenge,
  );

  const consumeChallenge = spyOn(registerUseCase, 'consumeChallenge').mockImplementation(
    async () => {
      if (options.consumeError) {
        throw options.consumeError;
      }

      return challenge;
    },
  );

  const passwordResetChallenge = Object.hasOwn(options, 'passwordResetChallenge')
    ? options.passwordResetChallenge!
    : challenge;

  const getPasswordResetChallenge = spyOn(resetUseCase, 'getOwnedChallenge').mockImplementation(
    async () => passwordResetChallenge,
  );

  const consumePasswordResetChallenge = spyOn(resetUseCase, 'consumeChallenge').mockImplementation(
    async () => passwordResetChallenge,
  );

  const accountUseCase = await runtime.resolve(userUseCase);

  const getAvailableByBiliUid = spyOn(accountUseCase, 'getAvailableByBiliUid').mockImplementation(
    async () =>
      ({
        id: 'user-id',
        biliUid: input.biliUid,
        username: input.username,
        status: 'active' as const,
      }) as never,
  );

  const setPassword = spyOn(accountUseCase, 'setPassword').mockImplementation(async () => {});

  return {
    consumeChallenge,
    consumePasswordResetChallenge,
    create,
    getOwnedChallenge,
    getPasswordResetChallenge,
    getAvailableByBiliUid,
    replayRewardBiliGuardByUserId,
    replayLegacyMigrations,
    tx,
    setPassword,
    useCase: container.userAuthUseCase,
  };
}

function matchedChallenge(
  biliUid = input.biliUid,
  expectedBiliUid = biliUid,
): BiliRegisterChallenge {
  return {
    status: 'matched',
    code: credential.code,
    verifierHash: 'verifier-hash',
    expectedBiliUid,
    biliUid,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

it('验证码状态只在 verifier、code 和待验证 UID 全部匹配时返回身份', async () => {
  const { getOwnedChallenge, useCase } = await createUseCase(matchedChallenge());

  await expect(
    useCase.getBiliRegisterCodeStatus(input.biliUid, credential.code, credential.verifier),
  ).resolves.toMatchObject({
    status: 'matched',
    biliUser: {
      uid: input.biliUid,
      name: undefined,
    },
  });
  expect(getOwnedChallenge).toHaveBeenCalledWith(
    credential.code,
    credential.verifier,
    input.biliUid,
  );
});

it('验证码状态拒绝错误的 verifier 或 code', async () => {
  const { useCase } = await createUseCase(null);

  await expect(
    useCase.getBiliRegisterCodeStatus(input.biliUid, credential.code, 'wrong-verifier'),
  ).rejects.toBeInstanceOf(BadRequestError);
});

it('验证码状态拒绝与待验证 UID 不同的弹幕 UID', async () => {
  const { useCase } = await createUseCase(matchedChallenge('654321', input.biliUid));

  await expect(
    useCase.getBiliRegisterCodeStatus(input.biliUid, credential.code, credential.verifier),
  ).rejects.toBeInstanceOf(BadRequestError);
});

it('用户注册会拒绝失效的 UID 归属验证', async () => {
  const { consumeChallenge, create, getOwnedChallenge, useCase } = await createUseCase(null);

  await expect(useCase.register(input, credential)).rejects.toBeInstanceOf(BadRequestError);
  expect(getOwnedChallenge).toHaveBeenCalledWith(
    credential.code,
    credential.verifier,
    input.biliUid,
  );
  expect(consumeChallenge).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

it('用户注册会拒绝已经消费的 UID 归属验证', async () => {
  const challenge = {
    ...matchedChallenge(),
    status: 'consumed' as const,
  };

  const { consumeChallenge, create, useCase } = await createUseCase(challenge);

  await expect(useCase.register(input, credential)).rejects.toBeInstanceOf(BadRequestError);
  expect(consumeChallenge).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

it('用户注册会拒绝缺少服务端验证凭据的请求', async () => {
  const { consumeChallenge, create, getOwnedChallenge, useCase } =
    await createUseCase(matchedChallenge());

  await expect(useCase.register(input, undefined)).rejects.toBeInstanceOf(BadRequestError);
  expect(getOwnedChallenge).not.toHaveBeenCalled();
  expect(consumeChallenge).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

it('用户注册会拒绝与验证结果不一致的 UID', async () => {
  const { consumeChallenge, create, useCase } = await createUseCase(matchedChallenge('654321'));

  await expect(useCase.register(input, credential)).rejects.toBeInstanceOf(BadRequestError);
  expect(consumeChallenge).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

it('用户注册验证 UID 后会创建用户并回放迁移积分及奖励', async () => {
  const {
    consumeChallenge,
    create,
    getOwnedChallenge,
    replayLegacyMigrations,
    replayRewardBiliGuardByUserId,
    tx,
    useCase,
  } = await createUseCase(matchedChallenge());

  await expect(useCase.register(input, credential)).resolves.toMatchObject({
    id: 'user-id',
    biliUid: input.biliUid,
  });
  expect(consumeChallenge).toHaveBeenCalledWith(
    credential.code,
    credential.verifier,
    input.biliUid,
  );
  expect(getOwnedChallenge).toHaveBeenCalledWith(
    credential.code,
    credential.verifier,
    input.biliUid,
  );
  expect(create).toHaveBeenCalledWith(
    {
      biliUid: input.biliUid,
      username: input.username,
      password: input.password,
    },
    tx,
  );
  expect(replayLegacyMigrations).toHaveBeenCalledWith(tx, {
    id: 'user-id',
    biliUid: input.biliUid,
    username: input.username,
  });
  expect(replayRewardBiliGuardByUserId).toHaveBeenCalledWith('user-id');
});

it('用户注册事务失败时不会消费已完成的 UID 验证', async () => {
  const migrationError = new Error('migration failed');

  const { consumeChallenge, replayRewardBiliGuardByUserId, useCase } = await createUseCase(
    matchedChallenge(),
    { migrationError },
  );

  await expect(useCase.register(input, credential)).rejects.toBe(migrationError);
  expect(consumeChallenge).not.toHaveBeenCalled();
  expect(replayRewardBiliGuardByUserId).not.toHaveBeenCalled();
});

it('用户创建成功后验证消费或奖励回放失败不会让注册失败', async () => {
  const consumeError = new Error('redis failed');
  const rewardError = new Error('reward failed');

  const { useCase } = await createUseCase(matchedChallenge(), {
    consumeError,
    rewardError,
  });

  await expect(useCase.register(input, credential)).resolves.toMatchObject({
    id: 'user-id',
    biliUid: input.biliUid,
  });
});

it('忘记密码只接受独立的密码重置验证并设置新密码', async () => {
  const challenge = matchedChallenge();

  const {
    consumeChallenge,
    consumePasswordResetChallenge,
    getOwnedChallenge,
    getPasswordResetChallenge,
    setPassword,
    useCase,
  } = await createUseCase(challenge, { passwordResetChallenge: challenge });

  await expect(
    useCase.resetPassword({ biliUid: input.biliUid, newPassword: 'new_password_1' }, credential),
  ).resolves.toBeUndefined();

  expect(getPasswordResetChallenge).toHaveBeenCalledWith(
    credential.code,
    credential.verifier,
    input.biliUid,
  );
  expect(consumePasswordResetChallenge).toHaveBeenCalledWith(
    credential.code,
    credential.verifier,
    input.biliUid,
  );
  expect(setPassword).toHaveBeenCalledWith('user-id', 'new_password_1');
  expect(getOwnedChallenge).not.toHaveBeenCalled();
  expect(consumeChallenge).not.toHaveBeenCalled();
});

it('忘记密码拒绝缺少或失效的密码重置验证', async () => {
  const { setPassword, useCase } = await createUseCase(matchedChallenge(), {
    passwordResetChallenge: null,
  });

  await expect(
    useCase.resetPassword({ biliUid: input.biliUid, newPassword: 'new_password_1' }, undefined),
  ).rejects.toBeInstanceOf(BadRequestError);
  await expect(
    useCase.resetPassword({ biliUid: input.biliUid, newPassword: 'new_password_1' }, credential),
  ).rejects.toBeInstanceOf(BadRequestError);
  expect(setPassword).not.toHaveBeenCalled();
});

it('忘记密码在验证凭证无法原子消费时不会设置密码', async () => {
  const challenge = matchedChallenge();

  const { consumePasswordResetChallenge, setPassword, useCase } = await createUseCase(challenge, {
    passwordResetChallenge: challenge,
  });

  consumePasswordResetChallenge.mockResolvedValueOnce(null);

  await expect(
    useCase.resetPassword({ biliUid: input.biliUid, newPassword: 'new_password_1' }, credential),
  ).rejects.toBeInstanceOf(BadRequestError);
  expect(setPassword).not.toHaveBeenCalled();
});
