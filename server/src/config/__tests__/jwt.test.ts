import { expect, it } from 'bun:test';

import { Cyrene } from 'cyrenex';

import { stub } from '#test-helpers/stub';

import { AdminJwtSecret, Config, configEnv, UserJwtSecret } from '../index';

it('resolves each app secret without requiring the other app secret', async () => {
  await using admin = new Cyrene().use(AdminJwtSecret).override(
    Config,
    stub('Config', {
      ...configEnv,
      ADMIN_JWT_SECRET: 'admin-secret',
      USER_JWT_SECRET: undefined,
    }),
  );
  await using user = new Cyrene().use(UserJwtSecret).override(
    Config,
    stub('Config', {
      ...configEnv,
      ADMIN_JWT_SECRET: undefined,
      USER_JWT_SECRET: 'user-secret',
    }),
  );

  expect(admin.resolve(AdminJwtSecret)).toBe('admin-secret');
  expect(user.resolve(UserJwtSecret)).toBe('user-secret');
});

it('rejects a missing app secret without falling back to the other app', async () => {
  await using admin = new Cyrene().use(AdminJwtSecret).override(
    Config,
    stub('Config', {
      ...configEnv,
      ADMIN_JWT_SECRET: undefined,
      USER_JWT_SECRET: 'user-secret',
    }),
  );
  await using user = new Cyrene().use(UserJwtSecret).override(
    Config,
    stub('Config', {
      ...configEnv,
      ADMIN_JWT_SECRET: 'admin-secret',
      USER_JWT_SECRET: undefined,
    }),
  );

  expect(() => admin.resolve(AdminJwtSecret)).toThrow('Failed to resolve AdminJwtSecret');
  expect(() => user.resolve(UserJwtSecret)).toThrow('Failed to resolve UserJwtSecret');
});
