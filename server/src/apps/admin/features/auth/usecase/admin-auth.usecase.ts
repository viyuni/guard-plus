import type { AdminLoginBody } from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';

import AdminFeature, { isAdminAvailable } from '#apps/admin/features/admin';
import Auth from '#modules/auth';
import { InvalidCredentialsError, PasswordUtil } from '#shared';

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
    AdminRepo: AdminFeature.AdminRepo,
    AuthUseCase: Auth.AuthUseCase,
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
