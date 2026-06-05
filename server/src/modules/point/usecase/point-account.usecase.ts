import type { AdjustBalanceBody } from '@shared/schema/point-account';

import type { DbClient } from '#db';

import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '../domain';
import { PointAccountRepository } from '../repository/point-account.repo';
import { PointBalanceUseCase } from './point-balance.usecase';

export interface PointAccountUseCaseDeps {
  db: DbClient;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
}

export class PointAccountUseCase {
  constructor(private readonly deps: PointAccountUseCaseDeps) {}

  listMine(userId: string) {
    return this.deps.pointAccountRepo.listMine(userId);
  }

  async adjustBalance(adminId: string, data: AdjustBalanceBody) {
    return this.deps.db.transaction(async tx => {
      // 确保账户存在并锁行
      const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, data);

      return this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'adjust',
        userId: account.userId,
        pointTypeId: account.pointTypeId,
        delta: data.delta,
        sourceType: POINT_CHANGE_SOURCE_TYPE.AdminAdjustment,
        sourceId: adminId,
        idempotencyKey: PointIdempotencyKey.adminAdjust({ adminId, nonce: data.nonce }),
        remark: data.remark ?? '管理员调整积分',
        metadata: {
          adminId,
          nonce: data.nonce,
        },
      });
    });
  }
}
