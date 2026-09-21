import type {
  CreatePointTypeBody,
  PointTypeIconUploadBody,
  UpdatePointTypeBody,
} from '@shared/schema/point-type';
import { type InferInput, ripple } from 'cyrenejs';

import { ImageStorage } from '#composition/tokens';

import {
  PointTypeNameExistsError,
  assertPointTypeExists,
  shouldDisablePointType,
  shouldEnablePointType,
} from '../domain';
import { PointTypeRepo } from '../repository';
import { PointTypeQuery } from './point-type-query';

/**
 * 积分类型管理端能力。
 *
 * 与 `PointTypeQuery` 分开，使只有真正需要写库与图片存储的 Admin 依赖图
 * 才绑定 `ImageStorage`。
 */
export const PointTypeAdminUseCase = ripple(
  {
    ImageStorage,
    PointTypeQuery,
    PointTypeRepo,
  },
  ({ ImageStorage, PointTypeQuery, PointTypeRepo }) => ({
    get(pointTypeId: string) {
      return PointTypeQuery.get(pointTypeId);
    },

    list() {
      return PointTypeQuery.list();
    },

    async create(data: CreatePointTypeBody) {
      const exists = await PointTypeRepo.findByName(data.name);

      if (exists) {
        throw new PointTypeNameExistsError();
      }

      return PointTypeRepo.create({ ...data, status: 'disabled' });
    },

    async update(pointTypeId: string, data: UpdatePointTypeBody) {
      const pointType = await PointTypeQuery.get(pointTypeId);

      if (data.name && data.name !== pointType.name) {
        const exists = await PointTypeRepo.findByName(data.name);

        if (exists) {
          throw new PointTypeNameExistsError();
        }
      }

      const updated = await PointTypeRepo.update(pointTypeId, data);

      assertPointTypeExists(updated);

      return updated;
    },

    async updateIcon(pointTypeId: string, body: PointTypeIconUploadBody) {
      await PointTypeQuery.get(pointTypeId);

      const { filename } = await ImageStorage.save(body.icon);

      const updated = await PointTypeRepo.update(pointTypeId, {
        icon: filename,
      });

      assertPointTypeExists(updated);

      return updated;
    },

    async enable(pointTypeId: string) {
      const pointType = await PointTypeQuery.get(pointTypeId);

      if (!shouldEnablePointType(pointType)) {
        return pointType;
      }

      return PointTypeRepo.updateStatus(pointTypeId, 'active');
    },

    async disable(pointTypeId: string) {
      const pointType = await PointTypeQuery.get(pointTypeId);

      if (!shouldDisablePointType(pointType)) {
        return pointType;
      }

      return PointTypeRepo.updateStatus(pointTypeId, 'disabled');
    },
  }),
  { debugName: 'PointTypeAdminUseCase' },
);

export type PointTypeAdminUseCase = InferInput<typeof PointTypeAdminUseCase>;
