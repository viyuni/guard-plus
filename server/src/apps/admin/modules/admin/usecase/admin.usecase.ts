import type {
  AdminCreateBody,
  AdminPageQuery,
  AdminUpdateBody,
  AdminUpdatePasswordBody,
} from '@shared/schema/admin';

import type { AdminRole } from '#db/schema';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';
import { logger } from '#utils/logger';

import {
  AdminAlreadyExistsError,
  AdminNotFoundError,
  AdminPolicy,
  AdminSuperAdminCannotBeBannedError,
} from '../domain';
import type { AdminRepository } from '../repository';

interface AdminUseCaseDeps {
  adminRepo: AdminRepository;
  defaultAdmin: {
    uid: string;
    username: string;
    password: string;
  };
}

export class AdminUseCase {
  constructor(private readonly deps: AdminUseCaseDeps) {}

  async me(adminId: string) {
    const { id, uid, username, role, lastLoginAt } = await this.getAvailableById(adminId);

    return {
      id,
      uid,
      username,
      role,
      lastLoginAt,
    };
  }

  async create(body: AdminCreateBody) {
    return this.createAdmin(body);
  }

  async page(query: AdminPageQuery) {
    return this.deps.adminRepo.page(query);
  }

  async update(adminId: string, body: AdminUpdateBody) {
    return this.updateAdmin(adminId, body);
  }

  async updateMe(adminId: string, body: AdminUpdateBody) {
    return this.updateAdmin(adminId, body);
  }

  private async updateAdmin(adminId: string, body: AdminUpdateBody) {
    const admin = await this.getAvailableById(adminId);

    if (body.username && body.username !== admin.username) {
      const existingUsernameAdmin = await this.deps.adminRepo.findByUsername(body.username);

      if (existingUsernameAdmin) {
        throw new AdminAlreadyExistsError('管理员用户名已存在');
      }
    }

    const updated = await this.deps.adminRepo.update(adminId, body);

    if (!updated) {
      throw new AdminNotFoundError();
    }

    return updated;
  }

  async getAvailableById(adminId: string) {
    const admin = await this.deps.adminRepo.findById(adminId);

    AdminPolicy.assertAvailableExists(admin);

    return admin;
  }

  async updatePassword(adminId: string, data: AdminUpdatePasswordBody) {
    const admin = await this.getAvailableById(adminId);

    const isValidPassword = await PasswordUtil.verify(data.oldPassword, admin.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await PasswordUtil.hash(data.newPassword);
    await this.deps.adminRepo.updatePassword(adminId, passwordHash);
  }

  async resetPassword(adminId: string) {
    const admin = await this.getAvailableById(adminId);

    const password = PasswordUtil.generate();
    const passwordHash = await PasswordUtil.hash(password);

    await this.deps.adminRepo.updatePassword(admin.id, passwordHash);

    return password;
  }

  async ban(adminId: string) {
    const admin = await this.getAvailableById(adminId);

    if (admin.role === 'superAdmin') {
      throw new AdminSuperAdminCannotBeBannedError();
    }

    const banned = await this.deps.adminRepo.ban(adminId);

    if (!banned) {
      throw new AdminNotFoundError();
    }

    return banned;
  }

  async restore(adminId: string) {
    const admin = await this.deps.adminRepo.findById(adminId);

    if (!admin) {
      throw new AdminNotFoundError();
    }

    const restored = await this.deps.adminRepo.restore(adminId);

    if (!restored) {
      throw new AdminNotFoundError();
    }

    return restored;
  }

  private async createAdmin(body: AdminCreateBody, role: AdminRole = 'admin') {
    const existingBiliUidAdmin = await this.deps.adminRepo.findByUid(body.uid);

    if (existingBiliUidAdmin) {
      throw new AdminAlreadyExistsError('管理员 B站 UID 已存在');
    }

    const passwordHash = await PasswordUtil.hash(body.password);

    const admin = await this.deps.adminRepo.create({
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

  async initDefaultAdmin() {
    const { uid, username, password } = this.deps.defaultAdmin;

    const existing = await this.deps.adminRepo.findByUid(uid);

    if (existing) {
      return;
    }

    await this.createAdmin(
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
  }
}
