import type { CreateRewardRuleBody, UpdateRewardRuleBody } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';

import type { InsertRewardRule, UpdateRewardRule } from '#infrastructure/db/schema';
import Point from '#modules/point';

import {
  RewardRuleNameExistsError,
  RewardRuleNotFoundError,
  assertRewardRuleTimeRange,
} from '../domain';
import { RewardRuleRepo } from '../repository';

export const RewardRuleUseCase = ripple(
  {
    PointTypeQuery: Point.PointTypeQuery,
    RewardRuleRepo,
  },
  ({ PointTypeQuery, RewardRuleRepo }) => {
    async function get(rewardRuleId: string) {
      const rule = await RewardRuleRepo.findById(rewardRuleId);

      if (!rule) {
        throw new RewardRuleNotFoundError();
      }

      return rule;
    }

    return {
      get,

      async create(ruleData: CreateRewardRuleBody) {
        await PointTypeQuery.getAvailableById(ruleData.pointTypeId);

        const exists = await RewardRuleRepo.findByName(ruleData.name);

        if (exists) {
          throw new RewardRuleNameExistsError();
        }

        const { endAt, startAt, ...data } = ruleData;

        const createData: InsertRewardRule = {
          ...data,
          endAt,
          startAt,
        };

        const rule = await RewardRuleRepo.create(createData);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async update(rewardRuleId: string, ruleData: UpdateRewardRuleBody) {
        const current = await get(rewardRuleId);

        if (ruleData.pointTypeId) {
          await PointTypeQuery.getAvailableById(ruleData.pointTypeId);
        }

        if (ruleData.name && ruleData.name !== current.name) {
          const exists = await RewardRuleRepo.findByName(ruleData.name);

          if (exists) {
            throw new RewardRuleNameExistsError();
          }
        }

        const { startAt, endAt } = ruleData;

        assertRewardRuleTimeRange({
          startAt: startAt === undefined ? current.startAt : startAt,
          endAt: endAt === undefined ? current.endAt : endAt,
        });

        const { endAt: _endAt, startAt: _startAt, ...data } = ruleData;

        const updateData: UpdateRewardRule = {
          ...data,
          endAt,
          startAt,
        };

        const rule = await RewardRuleRepo.update(rewardRuleId, updateData);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async enable(rewardRuleId: string) {
        const rule = await RewardRuleRepo.updateEnabled(rewardRuleId, true);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async disable(rewardRuleId: string) {
        const rule = await RewardRuleRepo.updateEnabled(rewardRuleId, false);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async remove(rewardRuleId: string) {
        const rule = await RewardRuleRepo.delete(rewardRuleId);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      listManage() {
        return RewardRuleRepo.listManage();
      },

      listVisible() {
        return RewardRuleRepo.listVisible();
      },
    };
  },
  { debugName: 'RewardRuleUseCase' },
);

export type RewardRuleUseCase = InferInput<typeof RewardRuleUseCase>;
