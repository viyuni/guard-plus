import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { eq, inArray, like } from 'drizzle-orm';

import { createDatabase, type DbClient } from '#db';
import { admins } from '#db/schema';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

import { AdminNotFoundError, AdminSuperAdminCannotBeBannedError } from '../domain/errors';
import { AdminRepository } from '../repository';
import { AdminUseCase } from '../usecase';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const testDefaultAdmin = {
  uid: '0721',
  username: 'Admin',
  password: 'password123',
};

let db: DbClient;
const batches = new Set<string>();

function newBatch() {
  const batch = `admin_test_${crypto.randomUUID().slice(0, 8)}`;
  batches.add(batch);
  return batch;
}

function createUseCase() {
  return new AdminUseCase({
    adminRepo: new AdminRepository(db),
    defaultAdmin: testDefaultAdmin,
  });
}

async function seedAdmin(input: {
  uid: string;
  username: string;
  role?: 'admin' | 'superAdmin';
  status?: 'active' | 'banned';
}) {
  const [admin] = await db
    .insert(admins)
    .values({
      uid: input.uid,
      username: input.username,
      role: input.role ?? 'admin',
      status: input.status ?? 'active',
      passwordHash: await PasswordUtil.hash('password123'),
    })
    .returning();

  if (!admin) throw new Error('seed admin failed');
  return admin;
}

async function findSuperAdmin() {
  return (
    (await db.query.admins.findFirst({
      where: {
        role: 'superAdmin',
      },
    })) ?? null
  );
}

async function cleanupBatch(batch: string) {
  const rows = await db
    .select({ id: admins.id })
    .from(admins)
    .where(like(admins.username, `${batch}%`));
  const ids = rows.map(row => row.id);

  if (ids.length > 0) {
    await db.delete(admins).where(inArray(admins.id, ids));
  }
}

async function clearAdmins() {
  await db.delete(admins);
}

beforeEach(async () => {
  if (!testDatabaseUrl) return;
  db = createDatabase(testDatabaseUrl);
  await clearAdmins();
});

afterEach(async () => {
  if (!db) return;

  try {
    for (const batch of batches) {
      await cleanupBatch(batch);
    }
  } finally {
    batches.clear();
    await db.$client.end();
  }
});

describeWithDatabase('AdminUseCase 真实数据库', () => {
  it('创建管理员时只能创建普通管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();

    const created = await useCase.create({
      uid: `${Date.now()}01` as unknown as `${number}`,
      username: `${batch}_normal`,
      password: 'password123',
      remark: 'normal',
    });
    const row = await db.query.admins.findFirst({
      where: {
        id: created.id,
      },
    });

    expect(row?.role).toBe('admin');
    expect(row?.status).toBe('active');
  });

  it('超级管理员可以更新管理员 username 和 remark', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}06`,
      username: `${batch}_update`,
      role: 'admin',
    });

    const updated = await useCase.update(seeded.id, {
      username: `${batch}_updated`,
    });

    expect(updated).toMatchObject({
      id: seeded.id,
      username: `${batch}_updated`,
      remark: null,
    });
  });

  it('管理员可以更新自己的 username 和 remark', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}07`,
      username: `${batch}_self`,
      role: 'admin',
    });

    const updated = await useCase.updateMe(seeded.id, {
      username: `${batch}_self_updated`,
    });

    expect(updated).toMatchObject({
      id: seeded.id,
      username: `${batch}_self_updated`,
      remark: null,
    });
  });

  it('管理员修改密码时会校验旧密码', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}10`,
      username: `${batch}_password`,
      role: 'admin',
    });

    let error: unknown;

    try {
      await useCase.updatePassword(seeded.id, {
        oldPassword: 'wrongPassword123',
        newPassword: 'newPassword123',
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(InvalidCredentialsError);

    const row = await db.query.admins.findFirst({
      where: {
        id: seeded.id,
      },
    });

    expect(await PasswordUtil.verify('password123', row!.passwordHash)).toBe(true);
  });

  it('更新管理员为重复 username 时会抛出错误', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const existing = await seedAdmin({
      uid: `${Date.now()}08`,
      username: `${batch}_existing`,
    });
    const target = await seedAdmin({
      uid: `${Date.now()}09`,
      username: `${batch}_target`,
    });

    let error: unknown;

    try {
      await useCase.update(target.id, {
        username: existing.username,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('管理员用户名已存在');
  });

  it('初始化默认管理员时创建唯一超级管理员', async () => {
    if (await findSuperAdmin()) {
      return;
    }

    const useCase = createUseCase();

    await useCase.initDefaultAdmin();

    const row = await db.query.admins.findFirst({
      where: {
        uid: testDefaultAdmin.uid,
      },
    });

    expect(row?.role).toBe('superAdmin');
    expect(row?.status).toBe('active');
  });

  it('默认管理员已存在时不会重复创建超级管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const existingSuperAdmin = await findSuperAdmin();
    if (!existingSuperAdmin) {
      await seedAdmin({
        uid: testDefaultAdmin.uid,
        username: `${batch}_existing_default`,
        role: 'superAdmin',
      });
    }

    await useCase.initDefaultAdmin();

    const rows = await db
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.uid, testDefaultAdmin.uid));

    expect(rows.length).toBe(1);
  });

  it('可以封禁普通管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded = await seedAdmin({
      uid: `${Date.now()}04`,
      username: `${batch}_ban`,
      role: 'admin',
    });

    const result = await useCase.ban(seeded.id);
    const row = await db.query.admins.findFirst({
      where: {
        id: seeded.id,
      },
    });

    expect(result).toEqual({
      id: seeded.id,
      status: 'banned',
      role: 'admin',
    });
    expect(row?.status).toBe('banned');
  });

  it('不能封禁超级管理员', async () => {
    const batch = newBatch();
    const useCase = createUseCase();
    const seeded =
      (await findSuperAdmin()) ??
      (await seedAdmin({
        uid: `${Date.now()}05`,
        username: `${batch}_super`,
        role: 'superAdmin',
      }));

    let error: unknown;

    try {
      await useCase.ban(seeded.id);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(AdminSuperAdminCannotBeBannedError);
  });

  it('封禁不存在的管理员会抛出错误', async () => {
    const useCase = createUseCase();

    let error: unknown;

    try {
      await useCase.ban(crypto.randomUUID());
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(AdminNotFoundError);
  });
});
