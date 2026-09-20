import type { UserRegisterBody } from '@shared/schema/user';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import { pointAccountUseCase } from '#modules/point';
import { rewardUseCase } from '#modules/reward';
import { userUseCase } from '#modules/user';

export const adminUserUseCase = ripple(
  {
    db: Database,
    pointAccountUseCase,
    rewardUseCase,
    userUseCase,
  },
  ({ db, pointAccountUseCase, rewardUseCase, userUseCase }) => ({
    async create(input: UserRegisterBody) {
      // 旧平台积分必须与用户创建原子提交，避免用户已注册却无法再次触发迁移。
      const user = await db.transaction(async tx => {
        const created = await userUseCase.create(input, tx);
        await pointAccountUseCase.replayLegacyMigrations(tx, created);
        return created;
      });

      // 大航海奖励按事件独立事务回放并支持重试，故在注册事务提交后执行。
      await rewardUseCase.replayRewardBiliGuardByUserId(user.id);

      return user;
    },
  }),
  { debugName: 'AdminUserUseCase' },
);

export type AdminUserUseCase = InferInput<typeof adminUserUseCase>;
