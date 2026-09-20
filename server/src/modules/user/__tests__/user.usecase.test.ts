import { afterAll, expect, it, spyOn } from 'bun:test';

import { Cyrene } from 'cyrenejs';

import { Database } from '#context/tokens';
import type { DbClient } from '#db';
import { DataSecret } from '#env/shared';
import type { UserRepository } from '#modules/user';
import { UserRepo, UserUseCase } from '#modules/user';
import { InvalidCredentialsError, PasswordUtil } from '#utils';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findById']>>>;

const runtimes: Array<{ dispose: () => Promise<void> }> = [];

afterAll(async () => {
  await Promise.all(runtimes.map(runtime => runtime.dispose()));
});

async function createFixture() {
  const passwordHash = await PasswordUtil.hash('old_password');

  const user = {
    id: 'authenticated-user-id',
    biliUid: '123456',
    username: 'tester',
    status: 'active',
    passwordHash,
  } as unknown as UserRow;

  const runtime = new Cyrene({
    providers: { UserRepo, UserUseCase },
    bindings: [
      // 只验证依赖装配与业务分支, 不连接数据库。
      { token: Database, value: {} as DbClient },
      { token: DataSecret, value: 'test-data-secret' },
    ],
  });

  runtimes.push(runtime);

  const container = await runtime.start();

  const findById = spyOn(container.UserRepo, 'findById').mockResolvedValue(user);

  const updatePassword = spyOn(container.UserRepo, 'updatePassword').mockImplementation(
    async (_userId: string, nextPasswordHash: string) => ({
      ...user,
      passwordHash: nextPasswordHash,
    }),
  );

  return { findById, updatePassword, useCase: container.UserUseCase };
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
