import type { UserLoginBody, UserRegisterBody } from '@shared/schema/user';

import type { AuthUseCase as SharedAuthUseCase } from '#modules/auth';
import type { BiliRegisterUseCase } from '#modules/auth';
import type { RewardUseCase } from '#modules/reward';
import type { UserUseCase } from '#modules/user';
import { BadRequestError } from '#utils';
import { InvalidCredentialsError } from '#utils';
import { PasswordUtil } from '#utils';

export class AuthUseCase {
  constructor(
    private readonly deps: {
      authUseCase: SharedAuthUseCase;
      biliRegisterUseCase?: BiliRegisterUseCase;
      biliRoom: number;
      rewardUseCase: RewardUseCase;
      userUseCase: UserUseCase;
    },
  ) {}

  async login(input: UserLoginBody) {
    const user = await this.deps.userUseCase.getAvailableByBiliUid(input.biliUid);

    const isValidPassword = await PasswordUtil.verify(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const tokens = await this.deps.authUseCase.createSessionTokenPair({
      id: user.id,
      role: 'user',
    });

    return {
      user: {
        id: user.id,
        biliUid: user.biliUid,
        username: user.username,
        status: user.status,
      },
      ...tokens,
    };
  }

  async register(
    input: UserRegisterBody,
    credential: { code: string; verifier: string } | undefined,
  ) {
    const challenge = credential
      ? await this.biliRegisterUseCase.consumeChallenge(credential.code, credential.verifier)
      : null;

    if (!challenge?.biliUid) {
      throw new BadRequestError('UID 归属验证已失效，请重新验证');
    }

    if (challenge.biliUid !== input.biliUid) {
      throw new BadRequestError('注册 UID 与已验证 UID 不一致');
    }

    const user = await this.deps.userUseCase.create(input);

    await this.deps.rewardUseCase.replayRewardBiliGuardByUserId(user.id);

    return user;
  }

  async createBiliRegisterCode() {
    const { challenge, verifier } = await this.biliRegisterUseCase.createChallenge();

    return {
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      roomId: this.deps.biliRoom,
      verifier,
    };
  }

  async getBiliRegisterCodeStatus(code: string | undefined, verifier: string | undefined) {
    if (!code) {
      return {
        status: 'expired' as const,
        roomId: this.deps.biliRoom,
      };
    }

    const challenge = await this.biliRegisterUseCase.getOwnedChallenge(code, verifier);

    if (!challenge || challenge.status === 'consumed') {
      return {
        status: 'expired' as const,
        roomId: this.deps.biliRoom,
      };
    }

    if (challenge.status === 'matched') {
      return {
        status: 'matched' as const,
        code: challenge.code,
        expiresAt: challenge.expiresAt,
        roomId: this.deps.biliRoom,
        biliUser: {
          uid: challenge.biliUid!,
          name: challenge.biliName,
        },
      };
    }

    return {
      status: 'pending' as const,
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      roomId: this.deps.biliRoom,
    };
  }

  private get biliRegisterUseCase() {
    if (!this.deps.biliRegisterUseCase) {
      throw new Error('Bilibili register use case is not configured');
    }

    return this.deps.biliRegisterUseCase;
  }
}
