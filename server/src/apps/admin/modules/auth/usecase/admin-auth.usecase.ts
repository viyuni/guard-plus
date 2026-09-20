import type { AdminLoginBody } from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';

import { isAdminAvailable } from '#apps/admin/modules/admin/domain';
import { AdminRepo } from '#apps/admin/modules/admin/repository';
import { AuthUseCase } from '#modules/auth';
import { InvalidCredentialsError, PasswordUtil } from '#utils';

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

export const AdminAuthUseCase = ripple(
  {
    AdminRepo,
    AuthUseCase,
  },
  ({ AdminRepo, AuthUseCase }) => ({
    async login(body: AdminLoginBody): Promise<AdminLoginResult> {
      const user = await AdminRepo.findByUid(body.uid);

      if (!user) {
        throw new InvalidCredentialsError();
      }

      if (!isAdminAvailable(user)) {
        throw new InvalidCredentialsError();
      }

      const isValidPassword = await PasswordUtil.verify(body.password, user.passwordHash);

      if (!isValidPassword) {
        throw new InvalidCredentialsError();
      }

      const loggedIn = await AdminRepo.updateLastLoginAt(user.id);
      const { id, uid, username, role, lastLoginAt } = loggedIn ?? user;

      const tokens = await AuthUseCase.createSessionTokenPair({
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
    },
  }),
  { debugName: 'AdminAuthUseCase' },
);

export type AdminAuthUseCase = InferInput<typeof AdminAuthUseCase>;
