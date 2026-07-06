import type { UserRegisterBody } from '#packages/schema/user';
import type { DbClient } from '~/src/db';
import type { PointAccountUseCase } from '~/src/modules/point';
import type { RewardUseCase } from '~/src/modules/reward';
import type { UserUseCase } from '~/src/modules/user';

export class AdminUserUseCase {
  constructor(
    private readonly deps: {
      db: DbClient;
      pointAccountUseCase: PointAccountUseCase;
      rewardUseCase: RewardUseCase;
      userUseCase: UserUseCase;
    },
  ) {}

  async create(input: UserRegisterBody) {
    // 旧平台积分必须与用户创建原子提交，避免用户已注册却无法再次触发迁移。
    const user = await this.deps.db.transaction(async tx => {
      const created = await this.deps.userUseCase.create(input, tx);
      await this.deps.pointAccountUseCase.replayLegacyMigrations(tx, created);
      return created;
    });

    // 大航海奖励按事件独立事务回放并支持重试，故在注册事务提交后执行。
    await this.deps.rewardUseCase.replayRewardBiliGuardByUserId(user.id);

    return user;
  }
}
