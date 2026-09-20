import type {
  AdminCreateBody,
  AdminPageQuery,
  AdminUpdateBody,
  AdminUpdatePasswordBody,
} from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';

import type { AdminRole } from '#db/schema';
import { InvalidCredentialsError, PasswordUtil } from '#utils';
import { logger } from '#utils/logger';

import {
  AdminAlreadyExistsError,
  AdminNotFoundError,
  assertAdminAvailableExists,
  AdminSuperAdminCannotBeBannedError,
} from '../domain';
import { adminRepo } from '../repository';

export interface AdminDefaultAccount {
  password: string;
  uid: string;
  username: string;
}

export const adminUseCase = ripple(
  {
    adminRepo,
  },
  ({ adminRepo }) => {
    async function getAvailableById(adminId: string) {
      const admin = await adminRepo.findById(adminId);

      assertAdminAvailableExists(admin);

      return admin;
    }

    async function createAdmin(body: AdminCreateBody, role: AdminRole = 'admin') {
      const existingBiliUidAdmin = await adminRepo.findByUid(body.uid);

      if (existingBiliUidAdmin) {
        throw new AdminAlreadyExistsError('管理员 B站 UID 已存在');
      }

      const passwordHash = await PasswordUtil.hash(body.password);

      const admin = await adminRepo.create({
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
        const existingUsernameAdmin = await adminRepo.findByUsername(body.username);

        if (existingUsernameAdmin) {
          throw new AdminAlreadyExistsError('管理员用户名已存在');
        }
      }

      const updated = await adminRepo.update(adminId, body);

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
        return adminRepo.page(query);
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
        await adminRepo.updatePassword(adminId, passwordHash);
      },

      async resetPassword(adminId: string) {
        const admin = await getAvailableById(adminId);

        const password = PasswordUtil.generate();
        const passwordHash = await PasswordUtil.hash(password);

        await adminRepo.updatePassword(admin.id, passwordHash);

        return password;
      },

      async ban(adminId: string) {
        const admin = await getAvailableById(adminId);

        if (admin.role === 'superAdmin') {
          throw new AdminSuperAdminCannotBeBannedError();
        }

        const banned = await adminRepo.ban(adminId);

        if (!banned) {
          throw new AdminNotFoundError();
        }

        return banned;
      },

      async restore(adminId: string) {
        const admin = await adminRepo.findById(adminId);

        if (!admin) {
          throw new AdminNotFoundError();
        }

        const restored = await adminRepo.restore(adminId);

        if (!restored) {
          throw new AdminNotFoundError();
        }

        return restored;
      },

      /**
       * 初始化默认超级管理员。
       *
       * 默认账号由调用方(应用入口)从 env 提供, UseCase 不读取全局配置。
       */
      async initDefaultAdmin(defaultAdmin: AdminDefaultAccount) {
        const { uid, username, password } = defaultAdmin;

        const existing = await adminRepo.findByUid(uid);

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

        if (Bun.env.NODE_ENV === 'development') {
          logger.info(
            `Creating default admin, UID: ${uid}, UserName: ${username}, Password: ${password}`,
          );
          return;
        }

        logger.info(`Creating default admin, UID: ${uid}, UserName: ${username}`);
      },
    };
  },
  { debugName: 'AdminUseCase' },
);

export type AdminUseCase = InferInput<typeof adminUseCase>;
