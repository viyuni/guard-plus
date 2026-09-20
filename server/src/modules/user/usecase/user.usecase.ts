import type {
  UpdateUserBody,
  UpdateUserPasswordBody,
  UserPageQuery,
  UserRegisterBody,
} from '@shared/schema/user';
import { type InferInput, ripple } from 'cyrenejs';

import type { DbExecutor } from '#db';
import { InvalidCredentialsError, PasswordUtil } from '#utils';

import {
  UserAlreadyRegisteredError,
  assertUserAvailableExists,
  assertUserExists,
  UserBasicInfoCrypto,
} from '../domain';
import { UserRepo } from '../repository';

export const UserUseCase = ripple(
  {
    UserBasicInfoCrypto,
    UserRepo,
  },
  ({ UserBasicInfoCrypto, UserRepo }) => {
    /**
     * 查询可用用户
     */
    async function getAvailableById(userId: string, db?: DbExecutor) {
      const user = await UserRepo.findById(userId, db);
      assertUserAvailableExists(user);

      return user;
    }

    return {
      getAvailableById,

      /**
       * 查询可用用户通过 UID
       */
      async getAvailableByBiliUid(biliUid: string, db?: DbExecutor) {
        const user = await UserRepo.findByBiliUid(biliUid, db);
        assertUserAvailableExists(user);

        return user;
      },

      async findByBiliUid(biliUid: string, db?: DbExecutor) {
        return UserRepo.findByBiliUid(biliUid, db);
      },

      /**
       * 获取用户详情
       */
      async getDetail(userId: string) {
        const user = await UserRepo.findDetailById(userId);

        assertUserAvailableExists(user);

        const { phoneEncrypted, emailEncrypted, addressEncrypted, ...profile } = user;

        return {
          ...profile,
          ...UserBasicInfoCrypto.decryptBasicInfo({
            phoneEncrypted,
            emailEncrypted,
            addressEncrypted,
          }),
        };
      },

      /**
       * 查询用户列表
       */
      async page(query: UserPageQuery) {
        const result = await UserRepo.page(query);

        return {
          ...result,
          items: result.items.map(user => {
            const { phoneEncrypted, emailEncrypted, addressEncrypted, ...item } = user;

            return {
              ...item,
              ...UserBasicInfoCrypto.decryptBasicInfo({
                phoneEncrypted,
                emailEncrypted,
                addressEncrypted,
              }),
            };
          }),
        };
      },

      /**
       * 封禁用户
       */
      async ban(userId: string) {
        const user = await UserRepo.ban(userId);

        assertUserExists(user);

        return user;
      },

      /**
       * 恢复用户
       */
      async restore(userId: string) {
        const user = await UserRepo.restore(userId);

        assertUserExists(user);

        return user;
      },

      /**
       * 创建用户
       */
      async create(input: UserRegisterBody, db?: DbExecutor) {
        const existing = await UserRepo.findByBiliUid(input.biliUid, db);

        if (existing) {
          throw new UserAlreadyRegisteredError();
        }

        const passwordHash = await PasswordUtil.hash(input.password);

        const user = await UserRepo.create(
          {
            ...input,
            ...UserBasicInfoCrypto.encryptBasicInfo(input),
            passwordHash,
          },
          db,
        );

        return {
          id: user.id,
          biliUid: user.biliUid,
          username: user.username,
          email: input.email,
          phone: input.phone,
          address: input.address,
        };
      },

      async update(userId: string, data: UpdateUserBody) {
        const user = await UserRepo.findById(userId);
        assertUserExists(user);

        const updateData = {
          ...(data.username === undefined ? {} : { username: data.username }),
          ...UserBasicInfoCrypto.encryptBasicInfoPatch(data),
        };

        const updatedUser = await UserRepo.update(user.id, updateData);
        const basicInfo = UserBasicInfoCrypto.decryptBasicInfo(updatedUser);

        return {
          id: updatedUser.id,
          biliUid: updatedUser.biliUid,
          username: updatedUser.username,
          email: basicInfo.email,
          phone: basicInfo.phone,
          address: basicInfo.address,
        };
      },

      async updatePassword(userId: string, data: UpdateUserPasswordBody) {
        const user = await getAvailableById(userId);

        const isValidPassword = await PasswordUtil.verify(data.oldPassword, user.passwordHash);

        if (!isValidPassword) {
          throw new InvalidCredentialsError();
        }

        const passwordHash = await PasswordUtil.hash(data.newPassword);

        await UserRepo.updatePassword(user.id, passwordHash);
      },

      async setPassword(userId: string, newPassword: string) {
        const user = await getAvailableById(userId);
        const passwordHash = await PasswordUtil.hash(newPassword);

        await UserRepo.updatePassword(user.id, passwordHash);
      },

      /**
       * 重置用户密码
       *
       * - 账号不会退出
       */
      async resetPassword(userId: string) {
        const user = await getAvailableById(userId);

        const radomPassword = PasswordUtil.generate();
        const passwordHash = await PasswordUtil.hash(radomPassword);

        await UserRepo.updatePassword(user.id, passwordHash);

        return {
          password: radomPassword,
        };
      },
    };
  },
  { debugName: 'UserUseCase' },
);

export type UserUseCase = InferInput<typeof UserUseCase>;
