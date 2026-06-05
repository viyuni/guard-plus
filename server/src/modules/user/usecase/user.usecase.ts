import type {
  UpdateUserBody,
  UpdateUserPasswordBody,
  UserPageQuery,
  UserRegisterBody,
} from '@shared/schema/user';

import type { DbExecutor } from '#db';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

import { UserAlreadyRegisteredError, UserBasicInfoCrypto, UserPolicy } from '../domain';
import { UserRepository } from '../repository';

export interface UserUseCaseDeps {
  userBasicInfoCrypto: UserBasicInfoCrypto;
  userRepo: UserRepository;
}

export class UserUseCase {
  constructor(private readonly deps: UserUseCaseDeps) {}

  /**
   * 查询可用用户
   */
  async getAvailableById(userId: string, db?: DbExecutor) {
    const user = await this.deps.userRepo.findById(userId, db);
    UserPolicy.assertAvailableExists(user);

    return user;
  }

  /**
   * 查询可用用户通过 UID
   */
  async getAvailableByBiliUid(biliUid: string, db?: DbExecutor) {
    const user = await this.deps.userRepo.findByBiliUid(biliUid, db);
    UserPolicy.assertAvailableExists(user);

    return user;
  }

  async findByBiliUid(biliUid: string, db?: DbExecutor) {
    return this.deps.userRepo.findByBiliUid(biliUid, db);
  }

  /**
   * 获取用户详情
   */
  async getDetail(userId: string) {
    const user = await this.deps.userRepo.findDetailById(userId);

    UserPolicy.assertAvailableExists(user);

    const { phoneEncrypted, emailEncrypted, addressEncrypted, ...profile } = user;

    return {
      ...profile,
      ...this.deps.userBasicInfoCrypto.decryptBasicInfo({
        phoneEncrypted,
        emailEncrypted,
        addressEncrypted,
      }),
    };
  }

  /**
   * 查询用户列表
   */
  async page(query: UserPageQuery) {
    const result = await this.deps.userRepo.page(query);

    return {
      ...result,
      items: result.items.map(user => {
        const { phoneEncrypted, emailEncrypted, addressEncrypted, ...item } = user;

        return {
          ...item,
          ...this.deps.userBasicInfoCrypto.decryptBasicInfo({
            phoneEncrypted,
            emailEncrypted,
            addressEncrypted,
          }),
        };
      }),
    };
  }

  /**
   * 封禁用户
   */
  async ban(userId: string) {
    const user = await this.deps.userRepo.ban(userId);

    UserPolicy.assertExists(user);

    return user;
  }

  /**
   * 恢复用户
   */
  async restore(userId: string) {
    const user = await this.deps.userRepo.restore(userId);

    UserPolicy.assertExists(user);

    return user;
  }

  /**
   * 创建用户
   */
  async create(data: UserRegisterBody) {
    const existing = await this.deps.userRepo.findByBiliUid(data.biliUid);

    if (existing) {
      throw new UserAlreadyRegisteredError();
    }

    const passwordHash = await PasswordUtil.hash(data.password);

    const user = await this.deps.userRepo.create({
      ...data,
      ...this.deps.userBasicInfoCrypto.encryptBasicInfo(data),
      passwordHash,
    });

    return {
      id: user.id,
      biliUid: user.biliUid,
      username: user.username,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };
  }

  async update(userId: string, data: UpdateUserBody) {
    const user = await this.deps.userRepo.findById(userId);
    UserPolicy.assertExists(user);

    const updateData = {
      ...(data.username === undefined ? {} : { username: data.username }),
      ...this.deps.userBasicInfoCrypto.encryptBasicInfoPatch(data),
    };

    const updatedUser = await this.deps.userRepo.update(user.id, updateData);
    const basicInfo = this.deps.userBasicInfoCrypto.decryptBasicInfo(updatedUser);

    return {
      id: updatedUser.id,
      biliUid: updatedUser.biliUid,
      username: updatedUser.username,
      email: basicInfo.email,
      phone: basicInfo.phone,
      address: basicInfo.address,
    };
  }

  async updatePassword(data: UpdateUserPasswordBody) {
    const user = await this.getAvailableByBiliUid(data.biliUid);

    const isValidPassword = await PasswordUtil.verify(data.oldPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await PasswordUtil.hash(data.newPassword);

    await this.deps.userRepo.updatePassword(user.id, passwordHash);
  }

  /**
   * 重置用户密码
   *
   * - 账号不会退出
   */
  async resetPassword(userId: string) {
    const user = await this.getAvailableById(userId);

    const radomPassword = PasswordUtil.generate();
    const passwordHash = await PasswordUtil.hash(radomPassword);

    await this.deps.userRepo.updatePassword(user.id, passwordHash);

    return {
      password: radomPassword,
    };
  }
}
