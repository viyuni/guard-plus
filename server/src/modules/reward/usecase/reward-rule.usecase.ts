import type { CreateRewardRuleBody, UpdateRewardRuleBody } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';

import type { InsertRewardRule, UpdateRewardRule } from '#db/schema';
import { pointTypeUseCase } from '#modules/point';

import {
  RewardRuleNameExistsError,
  RewardRuleNotFoundError,
  assertRewardRuleTimeRange,
} from '../domain';
import { rewardRuleRepo } from '../repository';

export const rewardRuleUseCase = ripple(
  {
    pointTypeUseCase,
    rewardRuleRepo,
  },
  ({ pointTypeUseCase, rewardRuleRepo }) => {
    async function get(rewardRuleId: string) {
      const rule = await rewardRuleRepo.findById(rewardRuleId);

      if (!rule) {
        throw new RewardRuleNotFoundError();
      }

      return rule;
    }

    return {
      get,

      async create(ruleData: CreateRewardRuleBody) {
        await pointTypeUseCase.getAvailableById(ruleData.pointTypeId);

        const exists = await rewardRuleRepo.findByName(ruleData.name);

        if (exists) {
          throw new RewardRuleNameExistsError();
        }

        const { endAt, startAt, ...data } = ruleData;

        const createData: InsertRewardRule = {
          ...data,
          endAt,
          startAt,
        };

        const rule = await rewardRuleRepo.create(createData);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async update(rewardRuleId: string, ruleData: UpdateRewardRuleBody) {
        const current = await get(rewardRuleId);

        if (ruleData.pointTypeId) {
          await pointTypeUseCase.getAvailableById(ruleData.pointTypeId);
        }

        if (ruleData.name && ruleData.name !== current.name) {
          const exists = await rewardRuleRepo.findByName(ruleData.name);

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

        const rule = await rewardRuleRepo.update(rewardRuleId, updateData);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async enable(rewardRuleId: string) {
        const rule = await rewardRuleRepo.updateEnabled(rewardRuleId, true);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async disable(rewardRuleId: string) {
        const rule = await rewardRuleRepo.updateEnabled(rewardRuleId, false);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      async remove(rewardRuleId: string) {
        const rule = await rewardRuleRepo.delete(rewardRuleId);

        if (!rule) {
          throw new RewardRuleNotFoundError();
        }

        return rule;
      },

      listManage() {
        return rewardRuleRepo.listManage();
      },

      listVisible() {
        return rewardRuleRepo.listVisible();
      },
    };
  },
  { debugName: 'RewardRuleUseCase' },
);

export type RewardRuleUseCase = InferInput<typeof rewardRuleUseCase>;
