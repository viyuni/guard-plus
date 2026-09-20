import type { AdminLoginBody } from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';

import { isAdminAvailable } from '#apps/admin/modules/admin/domain';
import { adminRepo } from '#apps/admin/modules/admin/repository';
import { authUseCase } from '#modules/auth';
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

export const adminAuthUseCase = ripple(
  {
    adminRepo,
    authUseCase,
  },
  ({ adminRepo, authUseCase }) => ({
    async login(body: AdminLoginBody): Promise<AdminLoginResult> {
      const user = await adminRepo.findByUid(body.uid);

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

      const loggedIn = await adminRepo.updateLastLoginAt(user.id);
      const { id, uid, username, role, lastLoginAt } = loggedIn ?? user;

      const tokens = await authUseCase.createSessionTokenPair({
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

export type AdminAuthUseCase = InferInput<typeof adminAuthUseCase>;
