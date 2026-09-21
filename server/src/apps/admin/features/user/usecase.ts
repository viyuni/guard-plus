import type { UserRegisterBody } from '@shared/schema/user';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#composition/tokens';
import Point from '#modules/point';
import Reward from '#modules/reward';
import User from '#modules/user';

/**
 * 管理端创建用户。
 *
 * 旧平台积分必须与用户创建原子提交，避免用户已注册却无法再次触发迁移；
 * 大航海奖励按事件独立事务回放并支持重试，故在注册事务提交后执行。
 */
export const AdminUserUseCase = ripple(
  {
    Database,
    PointAccountUseCase: Point.PointAccountUseCase,
    RewardReplayUseCase: Reward.RewardReplayUseCase,
    UserUseCase: User.UserUseCase,
  },
  ({ Database, PointAccountUseCase, RewardReplayUseCase, UserUseCase }) => ({
    async create(input: UserRegisterBody) {
      const user = await Database.transaction(async tx => {
        const created = await UserUseCase.create(input, tx);

        await PointAccountUseCase.replayLegacyMigrations(tx, created);

        return created;
      });

      await RewardReplayUseCase.replayByUserId(user.id);

      return user;
    },
  }),
  { debugName: 'AdminUserUseCase' },
);

export type AdminUserUseCase = InferInput<typeof AdminUserUseCase>;
