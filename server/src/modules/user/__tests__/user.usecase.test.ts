import { expect, it, mock } from 'bun:test';

import { InvalidCredentialsError, PasswordUtil } from '#utils';

import type { UserBasicInfoCrypto } from '../domain';
import type { UserRepository } from '../repository';
import { UserUseCase } from '../usecase';

async function createFixture() {
  const passwordHash = await PasswordUtil.hash('old_password');
  const user = {
    id: 'authenticated-user-id',
    biliUid: '123456',
    username: 'tester',
    status: 'active' as const,
    passwordHash,
  };
  const findById = mock(async () => user);
  const updatePassword = mock(async (_userId: string, nextPasswordHash: string) => ({
    ...user,
    passwordHash: nextPasswordHash,
  }));
  const useCase = new UserUseCase({
    userBasicInfoCrypto: {} as UserBasicInfoCrypto,
    userRepo: { findById, updatePassword } as unknown as UserRepository,
  });

  return { findById, updatePassword, useCase };
}

it('修改密码使用鉴权用户 ID 并校验旧密码', async () => {
  const { findById, updatePassword, useCase } = await createFixture();

  await useCase.updatePassword('authenticated-user-id', {
    oldPassword: 'old_password',
    newPassword: 'new_password_1',
  });

  expect(findById).toHaveBeenCalledWith('authenticated-user-id', undefined);
  expect(updatePassword).toHaveBeenCalledTimes(1);
  expect(updatePassword.mock.calls[0]?.[0]).toBe('authenticated-user-id');
  expect(await PasswordUtil.verify('new_password_1', updatePassword.mock.calls[0]![1])).toBe(true);
});

it('旧密码错误时拒绝修改密码', async () => {
  const { updatePassword, useCase } = await createFixture();

  await expect(
    useCase.updatePassword('authenticated-user-id', {
      oldPassword: 'wrong_password',
      newPassword: 'new_password_1',
    }),
  ).rejects.toBeInstanceOf(InvalidCredentialsError);
  expect(updatePassword).not.toHaveBeenCalled();
});
