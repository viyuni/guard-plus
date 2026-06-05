import type { AdminLoginBody } from '@shared/schema/admin';

import { AdminPolicy } from '#apps/admin/modules/admin/domain';
import { AdminRepository } from '#apps/admin/modules/admin/repository';
import type { DbExecutor } from '#db';
import type { AuthUseCase } from '#modules/auth';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

export interface AdminAuthUseCaseDeps {
  db: DbExecutor;
  adminRepo: AdminRepository;
  authUseCase: AuthUseCase;
}

export interface AdminLoginUser {
  id: string;
  uid: string;
  username: string;
  role: 'admin' | 'superAdmin';
  lastLoginAt: Date | null;
}

export interface AdminLoginResult {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  user: AdminLoginUser;
}

export class AdminAuthUseCase {
  constructor(private readonly deps: AdminAuthUseCaseDeps) {}

  async login(body: AdminLoginBody): Promise<AdminLoginResult> {
    const user = await this.deps.adminRepo.findByUid(body.uid);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!AdminPolicy.isAvailable(user)) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await PasswordUtil.verify(body.password, user.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const loggedIn = await this.deps.adminRepo.updateLastLoginAt(user.id);
    const { id, uid, username, role, lastLoginAt } = loggedIn ?? user;

    const tokens = await this.deps.authUseCase.createSessionTokenPair({
      id: user.id,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id,
        uid,
        username,
        role,
        lastLoginAt,
      },
    };
  }
}
