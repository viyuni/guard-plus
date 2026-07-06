import type {
  AdjustBalanceBody,
  CreateLegacyPointMigrationBody,
  LegacyPointMigrationPageQuery,
} from '@shared/schema/point-account';

import type { DbClient, DbTransaction } from '#db';
import { BadRequestError } from '#utils';

import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '../domain';
import { LegacyPointMigrationRepository } from '../repository/legacy-point-migration.repo';
import { PointAccountRepository } from '../repository/point-account.repo';
import { PointBalanceUseCase } from './point-balance.usecase';
import type { PointTypeUseCase } from './point-type.usecase';

export interface PointAccountUseCaseDeps {
  db: DbClient;
  legacyPointMigrationRepo: LegacyPointMigrationRepository;
  pointAccountRepo: PointAccountRepository;
  pointBalanceUseCase: PointBalanceUseCase;
  pointTypeUseCase: PointTypeUseCase;
}

export class PointAccountUseCase {
  constructor(private readonly deps: PointAccountUseCaseDeps) {}

  listMine(userId: string) {
    return this.deps.pointAccountRepo.listMine(userId);
  }

  pageLegacyMigrations(query: LegacyPointMigrationPageQuery) {
    return this.deps.legacyPointMigrationRepo.page(query);
  }

  async createLegacyMigration(data: CreateLegacyPointMigrationBody) {
    await this.deps.pointTypeUseCase.getAvailableById(data.pointTypeId);
    const migration = await this.deps.legacyPointMigrationRepo.create(data);

    if (!migration) {
      throw new BadRequestError('旧平台积分迁移记录创建失败');
    }

    return migration;
  }

  async deleteLegacyMigration(migrationId: string) {
    const migration = await this.deps.legacyPointMigrationRepo.deletePending(migrationId);

    if (!migration) {
      throw new BadRequestError('迁移记录不存在或已完成回放，无法删除');
    }

    return migration;
  }

  async replayLegacyMigrations(tx: DbTransaction, user: { id: string; biliUid: string }) {
    const migrations = await this.deps.legacyPointMigrationRepo.listPendingForUpdate(
      tx,
      user.biliUid,
    );
    const results = [];

    for (const migration of migrations) {
      const account = await this.deps.pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: migration.pointTypeId,
      });
      const result = await this.deps.pointBalanceUseCase.changeBalance(tx, account, {
        type: 'grant',
        userId: user.id,
        pointTypeId: migration.pointTypeId,
        delta: migration.points,
        sourceType: POINT_CHANGE_SOURCE_TYPE.LegacyMigration,
        sourceId: migration.id,
        idempotencyKey: PointIdempotencyKey.legacyMigration({ migrationId: migration.id }),
        remark: '旧平台积分迁移',
        metadata: { biliUid: user.biliUid, migrationId: migration.id },
      });

      const replayed = await this.deps.legacyPointMigrationRepo.markReplayed(
        tx,
        migration.id,
        user.id,
      );
      if (!replayed) {
        throw new BadRequestError('旧平台积分迁移状态更新失败');
      }
      results.push(result);
    }

    return results;
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
