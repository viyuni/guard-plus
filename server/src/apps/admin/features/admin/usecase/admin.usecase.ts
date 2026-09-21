import type {
  AdminCreateBody,
  AdminPageQuery,
  AdminUpdateBody,
  AdminUpdatePasswordBody,
} from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';

import { Logger } from '#composition/tokens';
import type { AdminRole } from '#infrastructure/db/schema';
import { InvalidCredentialsError, PasswordUtil } from '#shared';

import {
  AdminAlreadyExistsError,
  AdminNotFoundError,
  assertAdminAvailableExists,
  AdminSuperAdminCannotBeBannedError,
} from '../domain';
import { AdminRepo } from '../repository';

export interface AdminDefaultAccount {
  password: string;
  uid: string;
  username: string;
}

export const AdminUseCase = ripple(
  {
    AdminRepo,
    Logger,
  },
  ({ AdminRepo, Logger }) => {
    async function getAvailableById(adminId: string) {
      const admin = await AdminRepo.findById(adminId);

      assertAdminAvailableExists(admin);

      return admin;
    }

    async function createAdmin(body: AdminCreateBody, role: AdminRole = 'admin') {
      const existingBiliUidAdmin = await AdminRepo.findByUid(body.uid);

      if (existingBiliUidAdmin) {
        throw new AdminAlreadyExistsError('管理员 B站 UID 已存在');
      }

      const passwordHash = await PasswordUtil.hash(body.password);

      const admin = await AdminRepo.create({
        uid: body.uid,
        username: body.username,
        passwordHash,
        role,
        remark: body.remark ?? null,
      });

      return {
        id: admin.id,
        uid: admin.uid,
        username: admin.username,
        status: admin.status,
        role: admin.role,
        remark: admin.remark,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };
    }

    async function updateAdmin(adminId: string, body: AdminUpdateBody) {
      const admin = await getAvailableById(adminId);

      if (body.username && body.username !== admin.username) {
        const existingUsernameAdmin = await AdminRepo.findByUsername(body.username);

        if (existingUsernameAdmin) {
          throw new AdminAlreadyExistsError('管理员用户名已存在');
        }
      }

      const updated = await AdminRepo.update(adminId, body);

      if (!updated) {
        throw new AdminNotFoundError();
      }

      return updated;
    }

    return {
      async me(adminId: string) {
        const { id, uid, username, role, lastLoginAt } = await getAvailableById(adminId);

        return {
          id,
          uid,
          username,
          role,
          lastLoginAt,
        };
      },

      create(body: AdminCreateBody) {
        return createAdmin(body);
      },

      page(query: AdminPageQuery) {
        return AdminRepo.page(query);
      },

      update(adminId: string, body: AdminUpdateBody) {
        return updateAdmin(adminId, body);
      },

      updateMe(adminId: string, body: AdminUpdateBody) {
        return updateAdmin(adminId, body);
      },

      getAvailableById,

      async updatePassword(adminId: string, data: AdminUpdatePasswordBody) {
        const admin = await getAvailableById(adminId);

        const isValidPassword = await PasswordUtil.verify(data.oldPassword, admin.passwordHash);

        if (!isValidPassword) {
          throw new InvalidCredentialsError();
        }

        const passwordHash = await PasswordUtil.hash(data.newPassword);
        await AdminRepo.updatePassword(adminId, passwordHash);
      },

      async resetPassword(adminId: string) {
        const admin = await getAvailableById(adminId);

        const password = PasswordUtil.generate();
        const passwordHash = await PasswordUtil.hash(password);

        await AdminRepo.updatePassword(admin.id, passwordHash);

        return password;
      },

      async ban(adminId: string) {
        const admin = await getAvailableById(adminId);

        if (admin.role === 'superAdmin') {
          throw new AdminSuperAdminCannotBeBannedError();
        }

        const banned = await AdminRepo.ban(adminId);

        if (!banned) {
          throw new AdminNotFoundError();
        }

        return banned;
      },

      async restore(adminId: string) {
        const admin = await AdminRepo.findById(adminId);

        if (!admin) {
          throw new AdminNotFoundError();
        }

        const restored = await AdminRepo.restore(adminId);

        if (!restored) {
          throw new AdminNotFoundError();
        }

        return restored;
      },

      /**
       * 初始化默认超级管理员。
       *
       * 默认账号与"是否输出明文密码"都由调用方(组合根)提供,
       * UseCase 不读取全局配置或环境变量。
       */
      async initDefaultAdmin(defaultAdmin: AdminDefaultAccount, exposePassword: boolean) {
        const { uid, username, password } = defaultAdmin;

        const existing = await AdminRepo.findByUid(uid);

        if (existing) {
          return;
        }

        await createAdmin(
          {
            uid,
            username,
            password,
            remark: 'Default Admin',
          },
          'superAdmin',
        );

        if (exposePassword) {
          Logger.info(
            `Creating default admin, UID: ${uid}, UserName: ${username}, Password: ${password}`,
          );
          return;
        }

        Logger.info(`Creating default admin, UID: ${uid}, UserName: ${username}`);
      },
    };
  },
  { debugName: 'AdminUseCase' },
);

export type AdminUseCase = InferInput<typeof AdminUseCase>;
