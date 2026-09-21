import { type InferInput, ripple } from 'cyrenejs';

import type { DbExecutor } from '#infrastructure/db';

import { assertPointTypeAvailableExists, assertPointTypeExists } from '../domain';
import { PointTypeRepo } from '../repository';

/**
 * 积分类型只读能力。
 *
 * 事件、奖励、订单、商品等模块只需要读取积分类型，
 * 因此单独的 Query 可以避免把图片存储等 Admin 依赖带进它们的依赖图。
 */
export const PointTypeQuery = ripple(
  {
    PointTypeRepo,
  },
  ({ PointTypeRepo }) => ({
    async get(pointTypeId: string) {
      const pointType = await PointTypeRepo.findById(pointTypeId);

      assertPointTypeExists(pointType);

      return pointType;
    },

    async getAvailableById(pointTypeId: string, db?: DbExecutor) {
      const pointType = await PointTypeRepo.findById(pointTypeId, db);

      assertPointTypeAvailableExists(pointType);

      return pointType;
    },

    list() {
      return PointTypeRepo.list();
    },
  }),
  { debugName: 'PointTypeQuery' },
);

export type PointTypeQuery = InferInput<typeof PointTypeQuery>;
