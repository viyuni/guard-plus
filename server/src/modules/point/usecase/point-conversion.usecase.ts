import type {
  ConvertPointBody,
  CreatePointConversionRuleBody,
  UpdatePointConversionRuleBody,
} from '@shared/schema/point-conversion';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import type { InsertPointConversionRule, UpdatePointConversionRule } from '#db/schema';

import {
  POINT_CHANGE_SOURCE_TYPE,
  PointConversionRuleInvalidError,
  PointConversionRuleNameExistsError,
  PointConversionRuleNotFoundError,
  PointConversionRulePairExistsError,
  assertPointConversionRuleShape,
  assertPointConversionRuleAvailable,
  calculatePointConversionToAmount,
  PointIdempotencyKey,
} from '../domain';
import { pointAccountRepo, pointConversionRuleRepo } from '../repository';
import { pointBalanceUseCase } from './point-balance.usecase';
import { pointTypeUseCase } from './point-type.usecase';

export const pointConversionUseCase = ripple(
  {
    db: Database,
    pointAccountRepo,
    pointBalanceUseCase,
    pointConversionRuleRepo,
    pointTypeUseCase,
  },
  ({ db, pointAccountRepo, pointBalanceUseCase, pointConversionRuleRepo, pointTypeUseCase }) => {
    // 确保积分类型可用
    async function assertPointTypesAvailable(fromPointTypeId: string, toPointTypeId: string) {
      if (fromPointTypeId === toPointTypeId) {
        throw new PointConversionRuleInvalidError('来源积分类型和目标积分类型不能相同');
      }

      await Promise.all([
        pointTypeUseCase.getAvailableById(fromPointTypeId),
        pointTypeUseCase.getAvailableById(toPointTypeId),
      ]);
    }

    async function assertRulePairAvailable(
      fromPointTypeId: string,
      toPointTypeId: string,
      currentRuleId?: string,
    ) {
      const exists = await pointConversionRuleRepo.findByPointTypePair({
        fromPointTypeId,
        toPointTypeId,
      });

      if (exists && exists.id !== currentRuleId) {
        throw new PointConversionRulePairExistsError();
      }
    }

    async function get(pointConversionRuleId: string) {
      const rule = await pointConversionRuleRepo.findById(pointConversionRuleId);

      if (!rule) {
        throw new PointConversionRuleNotFoundError();
      }

      return rule;
    }

    return {
      listManage() {
        return pointConversionRuleRepo.listManage();
      },

      listVisible() {
        return pointConversionRuleRepo.listVisible();
      },

      get,

      async create(ruleData: CreatePointConversionRuleBody) {
        const { startAt, endAt } = ruleData;

        assertPointConversionRuleShape({
          ...ruleData,
          endAt,
          startAt,
        });

        const exists = await pointConversionRuleRepo.findByName(ruleData.name);

        if (exists) {
          throw new PointConversionRuleNameExistsError();
        }

        await assertPointTypesAvailable(ruleData.fromPointTypeId, ruleData.toPointTypeId);
        await assertRulePairAvailable(ruleData.fromPointTypeId, ruleData.toPointTypeId);

        const { endAt: _endAt, startAt: _startAt, ...data } = ruleData;

        const createData: InsertPointConversionRule = {
          ...data,
          endAt,
          startAt,
        };

        return pointConversionRuleRepo.create(createData);
      },

      async update(pointConversionRuleId: string, ruleData: UpdatePointConversionRuleBody) {
        const current = await get(pointConversionRuleId);
        const { startAt, endAt } = ruleData;

        const next = {
          ...current,
          ...ruleData,
          endAt: endAt === undefined ? current.endAt : endAt,
          startAt: startAt === undefined ? current.startAt : startAt,
        };

        assertPointConversionRuleShape(next);

        if (ruleData.name && ruleData.name !== current.name) {
          const exists = await pointConversionRuleRepo.findByName(ruleData.name);

          if (exists) {
            throw new PointConversionRuleNameExistsError();
          }
        }

        if (ruleData.fromPointTypeId || ruleData.toPointTypeId) {
          await assertPointTypesAvailable(next.fromPointTypeId, next.toPointTypeId);
          await assertRulePairAvailable(next.fromPointTypeId, next.toPointTypeId, current.id);
        }

        const { endAt: _endAt, startAt: _startAt, ...data } = ruleData;

        const updateData: UpdatePointConversionRule = {
          ...data,
          endAt,
          startAt,
        };

        const rule = await pointConversionRuleRepo.update(pointConversionRuleId, updateData);

        if (!rule) {
          throw new PointConversionRuleNotFoundError();
        }

        return rule;
      },

      async enable(pointConversionRuleId: string) {
        const rule = await get(pointConversionRuleId);

        if (rule.enabled) {
          return rule;
        }

        return pointConversionRuleRepo.enabled(pointConversionRuleId);
      },

      async disable(pointConversionRuleId: string) {
        const rule = await get(pointConversionRuleId);

        if (!rule.enabled) {
          return rule;
        }

        return pointConversionRuleRepo.disabled(pointConversionRuleId);
      },

      async remove(pointConversionRuleId: string) {
        const rule = await pointConversionRuleRepo.delete(pointConversionRuleId);

        if (!rule) {
          throw new PointConversionRuleNotFoundError();
        }

        return rule;
      },

      async convert(conversionData: ConvertPointBody) {
        const rule = await pointConversionRuleRepo.findById(conversionData.ruleId);

        if (!rule) {
          throw new PointConversionRuleNotFoundError();
        }

        assertPointConversionRuleAvailable(rule);

        const toAmount = calculatePointConversionToAmount(rule, conversionData.fromAmount);

        return db.transaction(async tx => {
          // 获取扣除的积分账户并行锁
          const fromAccount = await pointAccountRepo.ensureAccountAndLock(tx, {
            userId: conversionData.userId,
            pointTypeId: rule.fromPointTypeId,
          });

          // 获取添加的积分账户并行锁
          const toAccount = await pointAccountRepo.ensureAccountAndLock(tx, {
            userId: conversionData.userId,
            pointTypeId: rule.toPointTypeId,
          });

          const sourceId = `convert:${rule.id}:${conversionData.nonce}`;
          const remark = conversionData.remark ?? `积分转换：${rule.name}`;

          // 扣除积分
          const consumeResult = await pointBalanceUseCase.changeBalance(tx, fromAccount, {
            type: 'consume',
            userId: conversionData.userId,
            pointTypeId: rule.fromPointTypeId,
            delta: -conversionData.fromAmount,
            sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
            sourceId,
            idempotencyKey: PointIdempotencyKey.conversionConsume({
              ruleId: rule.id,
              nonce: conversionData.nonce,
            }),
            remark,
            metadata: {
              ruleId: rule.id,
              nonce: conversionData.nonce,
              toPointTypeId: rule.toPointTypeId,
              toAmount,
            },
          });

          // 添加积分
          const grantResult = await pointBalanceUseCase.changeBalance(tx, toAccount, {
            type: 'grant',
            userId: conversionData.userId,
            pointTypeId: rule.toPointTypeId,
            delta: toAmount,
            sourceType: POINT_CHANGE_SOURCE_TYPE.Conversion,
            sourceId,
            idempotencyKey: PointIdempotencyKey.conversionGrant({
              ruleId: rule.id,
              nonce: conversionData.nonce,
            }),
            remark,
            metadata: {
              ruleId: rule.id,
              nonce: conversionData.nonce,
              fromPointTypeId: rule.fromPointTypeId,
              fromAmount: conversionData.fromAmount,
            },
          });

          return {
            rule,
            from: consumeResult,
            to: grantResult,
          };
        });
      },
    };
  },
  { debugName: 'PointConversionUseCase' },
);

export type PointConversionUseCase = InferInput<typeof pointConversionUseCase>;
