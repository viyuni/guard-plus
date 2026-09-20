import type { UserRegisterBody } from '@shared/schema/user';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import { PointAccountUseCase } from '#modules/point';
import { RewardUseCase } from '#modules/reward';
import { UserUseCase } from '#modules/user';

export const AdminUserUseCase = ripple(
  {
    Database,
    PointAccountUseCase,
    RewardUseCase,
    UserUseCase,
  },
  ({ Database, PointAccountUseCase, RewardUseCase, UserUseCase }) => ({
    async create(input: UserRegisterBody) {
      // 旧平台积分必须与用户创建原子提交，避免用户已注册却无法再次触发迁移。
      const user = await Database.transaction(async tx => {
        const created = await UserUseCase.create(input, tx);
        await PointAccountUseCase.replayLegacyMigrations(tx, created);
        return created;
      });

      // 大航海奖励按事件独立事务回放并支持重试，故在注册事务提交后执行。
      await RewardUseCase.replayRewardBiliGuardByUserId(user.id);

      return user;
    },
  }),
  { debugName: 'AdminUserUseCase' },
);

export type AdminUserUseCase = InferInput<typeof AdminUserUseCase>;
