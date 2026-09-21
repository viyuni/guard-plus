import type {
  AdjustBalanceBody,
  CreateLegacyPointMigrationBody,
  LegacyPointMigrationPageQuery,
} from '@shared/schema/point-account';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#composition/tokens';
import type { DbTransaction } from '#infrastructure/db';
import User from '#modules/user';
import { BadRequestError } from '#shared';

import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '../domain';
import { LegacyPointMigrationRepo, PointAccountRepo } from '../repository';
import { PointBalanceUseCase } from './point-balance.usecase';
import { PointTypeQuery } from './point-type-query';

export const PointAccountUseCase = ripple(
  {
    Database,
    LegacyPointMigrationRepo,
    PointAccountRepo,
    PointBalanceUseCase,
    PointTypeQuery,
    UserUseCase: User.UserUseCase,
  },
  ({
    Database,
    LegacyPointMigrationRepo,
    PointAccountRepo,
    PointBalanceUseCase,
    PointTypeQuery,
    UserUseCase,
  }) => {
    async function replayLegacyMigrationRecord(
      tx: DbTransaction,
      user: { id: string; biliUid: string },
      migration: { id: string; pointTypeId: string; points: number },
    ) {
      const account = await PointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: migration.pointTypeId,
      });

      const result = await PointBalanceUseCase.changeBalance(tx, account, {
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

      const replayed = await LegacyPointMigrationRepo.markReplayed(tx, migration.id, user.id);

      if (!replayed) {
        throw new BadRequestError('旧平台积分迁移状态更新失败');
      }

      return result;
    }

    return {
      listMine(userId: string) {
        return PointAccountRepo.listMine(userId);
      },

      pageLegacyMigrations(query: LegacyPointMigrationPageQuery) {
        return LegacyPointMigrationRepo.page(query);
      },

      async createLegacyMigration(data: CreateLegacyPointMigrationBody) {
        await PointTypeQuery.getAvailableById(data.pointTypeId);
        const migration = await LegacyPointMigrationRepo.create(data);

        if (!migration) {
          throw new BadRequestError('旧平台积分迁移记录创建失败');
        }

        return migration;
      },

      async deleteLegacyMigration(migrationId: string) {
        const migration = await LegacyPointMigrationRepo.deletePending(migrationId);

        if (!migration) {
          throw new BadRequestError('迁移记录不存在或已完成回放，无法删除');
        }

        return migration;
      },

      async replayLegacyMigration(migrationId: string) {
        return Database.transaction(async tx => {
          const migration = await LegacyPointMigrationRepo.findPendingByIdForUpdate(
            tx,
            migrationId,
          );

          if (!migration) {
            throw new BadRequestError('迁移记录不存在或已完成回放');
          }

          const user = await UserUseCase.getAvailableByBiliUid(migration.biliUid, tx);
          return replayLegacyMigrationRecord(tx, user, migration);
        });
      },

      async replayLegacyMigrations(tx: DbTransaction, user: { id: string; biliUid: string }) {
        const migrations = await LegacyPointMigrationRepo.listPendingForUpdate(tx, user.biliUid);

        const results = [];

        for (const migration of migrations) {
          results.push(await replayLegacyMigrationRecord(tx, user, migration));
        }

        return results;
      },

      async adjustBalance(adminId: string, data: AdjustBalanceBody) {
        return Database.transaction(async tx => {
          // 确保账户存在并锁行
          const account = await PointAccountRepo.ensureAccountAndLock(tx, data);

          return PointBalanceUseCase.changeBalance(tx, account, {
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
      },
    };
  },
  { debugName: 'PointAccountUseCase' },
);

export type PointAccountUseCase = InferInput<typeof PointAccountUseCase>;
