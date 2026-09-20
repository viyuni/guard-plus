import type { UserLoginBody, UserRegisterBody, UserResetPasswordBody } from '@shared/schema/user';
import { type InferInput, ripple } from 'cyrenejs';

import { BiliRoom, Database } from '#context/tokens';
import { authUseCase, biliPasswordResetUseCase, biliRegisterUseCase } from '#modules/auth';
import { pointAccountUseCase } from '#modules/point';
import { rewardUseCase } from '#modules/reward';
import { userUseCase } from '#modules/user';
import { BadRequestError, InvalidCredentialsError, PasswordUtil } from '#utils';
import { logger } from '#utils/logger';

const userAuthLogger = logger.scope('UserAuthUseCase');

export const userAuthUseCase = ripple(
  {
    authUseCase,
    biliPasswordResetUseCase,
    biliRegisterUseCase,
    biliRoom: BiliRoom,
    db: Database,
    pointAccountUseCase,
    rewardUseCase,
    userUseCase,
  },
  ({
    authUseCase,
    biliPasswordResetUseCase,
    biliRegisterUseCase,
    biliRoom,
    db,
    pointAccountUseCase,
    rewardUseCase,
    userUseCase,
  }) => ({
    async login(input: UserLoginBody) {
      const user = await userUseCase.getAvailableByBiliUid(input.biliUid);

      const isValidPassword = await PasswordUtil.verify(input.password, user.passwordHash);

      if (!isValidPassword) {
        throw new InvalidCredentialsError();
      }

      const tokens = await authUseCase.createSessionTokenPair({
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
    },

    async register(
      input: UserRegisterBody,
      credential: { code: string; verifier: string } | undefined,
    ) {
      if (!credential) {
        throw new BadRequestError('UID 归属验证已失效，请重新验证');
      }

      const challenge = await biliRegisterUseCase.getOwnedChallenge(
        credential.code,
        credential.verifier,
        input.biliUid,
      );

      if (challenge?.status !== 'matched' || !challenge.biliUid) {
        throw new BadRequestError('UID 归属验证已失效，请重新验证');
      }

      if (challenge.expectedBiliUid !== input.biliUid || challenge.biliUid !== input.biliUid) {
        throw new BadRequestError('注册 UID 与已验证 UID 不一致');
      }

      // 旧平台积分必须与用户创建原子提交，避免用户已注册却无法再次触发迁移。
      const user = await db.transaction(async tx => {
        const created = await userUseCase.create(input, tx);
        await pointAccountUseCase.replayLegacyMigrations(tx, created);
        return created;
      });

      // 用户创建成功后再消费验证，避免数据库事务失败时丢失已完成的 UID 验证。
      try {
        await biliRegisterUseCase.consumeChallenge(
          credential.code,
          credential.verifier,
          input.biliUid,
        );
      } catch (error) {
        userAuthLogger.warn(
          {
            userId: user.id,
            biliUid: user.biliUid,
            error,
          },
          'Consume Bilibili register challenge failed after user registration',
        );
      }

      // 奖励回放是注册后的可重试任务，不应让已经成功创建的用户看到注册失败。
      try {
        await rewardUseCase.replayRewardBiliGuardByUserId(user.id);
      } catch (error) {
        userAuthLogger.warn(
          {
            userId: user.id,
            biliUid: user.biliUid,
            error,
          },
          'Replay Bilibili guard rewards failed after user registration',
        );
      }

      return user;
    },

    async resetPassword(
      input: UserResetPasswordBody,
      credential: { code: string; verifier: string } | undefined,
    ) {
      if (!credential) {
        throw new BadRequestError('UID 归属验证已失效，请重新验证');
      }

      const challenge = await biliPasswordResetUseCase.getOwnedChallenge(
        credential.code,
        credential.verifier,
        input.biliUid,
      );

      if (
        challenge?.status !== 'matched' ||
        challenge.expectedBiliUid !== input.biliUid ||
        challenge.biliUid !== input.biliUid
      ) {
        throw new BadRequestError('UID 归属验证已失效，请重新验证');
      }

      const user = await userUseCase.getAvailableByBiliUid(input.biliUid);

      const consumed = await biliPasswordResetUseCase.consumeChallenge(
        credential.code,
        credential.verifier,
        input.biliUid,
      );

      if (!consumed) {
        throw new BadRequestError('UID 归属验证已失效，请重新验证');
      }

      await userUseCase.setPassword(user.id, input.newPassword);
    },

    async createBiliRegisterCode(biliUid: string) {
      const { challenge, verifier } = await biliRegisterUseCase.createChallenge(biliUid);

      return {
        code: challenge.code,
        expiresAt: challenge.expiresAt,
        roomId: biliRoom,
        verifier,
      };
    },

    async getBiliRegisterCodeStatus(
      biliUid: string,
      code: string | undefined,
      verifier: string | undefined,
    ) {
      const challenge = await biliRegisterUseCase.getOwnedChallenge(code, verifier, biliUid);

      if (
        !challenge ||
        challenge.status === 'consumed' ||
        challenge.expectedBiliUid !== biliUid ||
        (challenge.status === 'matched' && challenge.biliUid !== biliUid)
      ) {
        throw new BadRequestError('UID 归属验证信息不匹配，请重新验证');
      }

      if (challenge.status === 'matched') {
        return {
          status: 'matched' as const,
          code: challenge.code,
          expiresAt: challenge.expiresAt,
          roomId: biliRoom,
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
        roomId: biliRoom,
      };
    },

    async createBiliPasswordResetCode(biliUid: string) {
      await userUseCase.getAvailableByBiliUid(biliUid);
      const { challenge, verifier } = await biliPasswordResetUseCase.createChallenge(biliUid);

      return {
        code: challenge.code,
        expiresAt: challenge.expiresAt,
        roomId: biliRoom,
        verifier,
      };
    },

    async getBiliPasswordResetCodeStatus(
      biliUid: string,
      code: string | undefined,
      verifier: string | undefined,
    ) {
      const challenge = await biliPasswordResetUseCase.getOwnedChallenge(code, verifier, biliUid);

      if (
        !challenge ||
        challenge.status === 'consumed' ||
        challenge.expectedBiliUid !== biliUid ||
        (challenge.status === 'matched' && challenge.biliUid !== biliUid)
      ) {
        throw new BadRequestError('UID 归属验证信息不匹配，请重新验证');
      }

      if (challenge.status === 'matched') {
        return {
          status: 'matched' as const,
          code: challenge.code,
          expiresAt: challenge.expiresAt,
          roomId: biliRoom,
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
        roomId: biliRoom,
      };
    },
  }),
  { debugName: 'UserAuthUseCase' },
);

export type UserAuthUseCase = InferInput<typeof userAuthUseCase>;
