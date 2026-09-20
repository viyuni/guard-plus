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
  userBasicInfoCrypto,
} from '../domain';
import { userRepo } from '../repository';

export const userUseCase = ripple(
  {
    userBasicInfoCrypto,
    userRepo,
  },
  ({ userBasicInfoCrypto, userRepo }) => {
    /**
     * 查询可用用户
     */
    async function getAvailableById(userId: string, db?: DbExecutor) {
      const user = await userRepo.findById(userId, db);
      assertUserAvailableExists(user);

      return user;
    }

    return {
      getAvailableById,

      /**
       * 查询可用用户通过 UID
       */
      async getAvailableByBiliUid(biliUid: string, db?: DbExecutor) {
        const user = await userRepo.findByBiliUid(biliUid, db);
        assertUserAvailableExists(user);

        return user;
      },

      async findByBiliUid(biliUid: string, db?: DbExecutor) {
        return userRepo.findByBiliUid(biliUid, db);
      },

      /**
       * 获取用户详情
       */
      async getDetail(userId: string) {
        const user = await userRepo.findDetailById(userId);

        assertUserAvailableExists(user);

        const { phoneEncrypted, emailEncrypted, addressEncrypted, ...profile } = user;

        return {
          ...profile,
          ...userBasicInfoCrypto.decryptBasicInfo({
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
        const result = await userRepo.page(query);

        return {
          ...result,
          items: result.items.map(user => {
            const { phoneEncrypted, emailEncrypted, addressEncrypted, ...item } = user;

            return {
              ...item,
              ...userBasicInfoCrypto.decryptBasicInfo({
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
        const user = await userRepo.ban(userId);

        assertUserExists(user);

        return user;
      },

      /**
       * 恢复用户
       */
      async restore(userId: string) {
        const user = await userRepo.restore(userId);

        assertUserExists(user);

        return user;
      },

      /**
       * 创建用户
       */
      async create(input: UserRegisterBody, db?: DbExecutor) {
        const existing = await userRepo.findByBiliUid(input.biliUid, db);

        if (existing) {
          throw new UserAlreadyRegisteredError();
        }

        const passwordHash = await PasswordUtil.hash(input.password);

        const user = await userRepo.create(
          {
            ...input,
            ...userBasicInfoCrypto.encryptBasicInfo(input),
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
        const user = await userRepo.findById(userId);
        assertUserExists(user);

        const updateData = {
          ...(data.username === undefined ? {} : { username: data.username }),
          ...userBasicInfoCrypto.encryptBasicInfoPatch(data),
        };

        const updatedUser = await userRepo.update(user.id, updateData);
        const basicInfo = userBasicInfoCrypto.decryptBasicInfo(updatedUser);

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

        await userRepo.updatePassword(user.id, passwordHash);
      },

      async setPassword(userId: string, newPassword: string) {
        const user = await getAvailableById(userId);
        const passwordHash = await PasswordUtil.hash(newPassword);

        await userRepo.updatePassword(user.id, passwordHash);
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

        await userRepo.updatePassword(user.id, passwordHash);

        return {
          password: radomPassword,
        };
      },
    };
  },
  { debugName: 'UserUseCase' },
);

export type UserUseCase = InferInput<typeof userUseCase>;
