import type {
  AdjustBalanceBody,
  CreateLegacyPointMigrationBody,
  LegacyPointMigrationPageQuery,
} from '@shared/schema/point-account';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import type { DbTransaction } from '#db';
import { userUseCase } from '#modules/user';
import { BadRequestError } from '#utils';

import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '../domain';
import { legacyPointMigrationRepo, pointAccountRepo } from '../repository';
import { pointBalanceUseCase } from './point-balance.usecase';
import { pointTypeUseCase } from './point-type.usecase';

export const pointAccountUseCase = ripple(
  {
    db: Database,
    legacyPointMigrationRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    userUseCase,
  },
  ({
    db,
    legacyPointMigrationRepo,
    pointAccountRepo,
    pointBalanceUseCase,
    pointTypeUseCase,
    userUseCase,
  }) => {
    async function replayLegacyMigrationRecord(
      tx: DbTransaction,
      user: { id: string; biliUid: string },
      migration: { id: string; pointTypeId: string; points: number },
    ) {
      const account = await pointAccountRepo.ensureAccountAndLock(tx, {
        userId: user.id,
        pointTypeId: migration.pointTypeId,
      });

      const result = await pointBalanceUseCase.changeBalance(tx, account, {
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

      const replayed = await legacyPointMigrationRepo.markReplayed(tx, migration.id, user.id);

      if (!replayed) {
        throw new BadRequestError('旧平台积分迁移状态更新失败');
      }

      return result;
    }

    return {
      listMine(userId: string) {
        return pointAccountRepo.listMine(userId);
      },

      pageLegacyMigrations(query: LegacyPointMigrationPageQuery) {
        return legacyPointMigrationRepo.page(query);
      },

      async createLegacyMigration(data: CreateLegacyPointMigrationBody) {
        await pointTypeUseCase.getAvailableById(data.pointTypeId);
        const migration = await legacyPointMigrationRepo.create(data);

        if (!migration) {
          throw new BadRequestError('旧平台积分迁移记录创建失败');
        }

        return migration;
      },

      async deleteLegacyMigration(migrationId: string) {
        const migration = await legacyPointMigrationRepo.deletePending(migrationId);

        if (!migration) {
          throw new BadRequestError('迁移记录不存在或已完成回放，无法删除');
        }

        return migration;
      },

      async replayLegacyMigration(migrationId: string) {
        return db.transaction(async tx => {
          const migration = await legacyPointMigrationRepo.findPendingByIdForUpdate(
            tx,
            migrationId,
          );

          if (!migration) {
            throw new BadRequestError('迁移记录不存在或已完成回放');
          }

          const user = await userUseCase.getAvailableByBiliUid(migration.biliUid, tx);
          return replayLegacyMigrationRecord(tx, user, migration);
        });
      },

      async replayLegacyMigrations(tx: DbTransaction, user: { id: string; biliUid: string }) {
        const migrations = await legacyPointMigrationRepo.listPendingForUpdate(tx, user.biliUid);

        const results = [];

        for (const migration of migrations) {
          results.push(await replayLegacyMigrationRecord(tx, user, migration));
        }

        return results;
      },

      async adjustBalance(adminId: string, data: AdjustBalanceBody) {
        return db.transaction(async tx => {
          // 确保账户存在并锁行
          const account = await pointAccountRepo.ensureAccountAndLock(tx, data);

          return pointBalanceUseCase.changeBalance(tx, account, {
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

export type PointAccountUseCase = InferInput<typeof pointAccountUseCase>;
