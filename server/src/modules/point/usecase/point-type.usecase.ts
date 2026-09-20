import type {
  CreatePointTypeBody,
  PointTypeIconUploadBody,
  UpdatePointTypeBody,
} from '@shared/schema/point-type';
import { type InferInput, ripple } from 'cyrenejs';

import { PointImageUseCase } from '#context/tokens';
import type { DbExecutor } from '#db';

import {
  PointTypeNameExistsError,
  assertPointTypeAvailableExists,
  assertPointTypeExists,
  shouldEnablePointType,
  shouldDisablePointType,
} from '../domain';
import { pointTypeRepo } from '../repository';

export const pointTypeUseCase = ripple(
  {
    imageUseCase: PointImageUseCase,
    pointTypeRepo,
  },
  ({ imageUseCase, pointTypeRepo }) => ({
    async get(pointTypeId: string) {
      const pointType = await pointTypeRepo.findById(pointTypeId);

      assertPointTypeExists(pointType);

      return pointType;
    },

    async getAvailableById(pointTypeId: string, db?: DbExecutor) {
      const pointType = await pointTypeRepo.findById(pointTypeId, db);

      assertPointTypeAvailableExists(pointType);

      return pointType;
    },

    async create(data: CreatePointTypeBody) {
      const exists = await pointTypeRepo.findByName(data.name);

      if (exists) {
        throw new PointTypeNameExistsError();
      }

      return pointTypeRepo.create({ ...data, status: 'disabled' });
    },

    async update(pointTypeId: string, data: UpdatePointTypeBody) {
      const pointType = await pointTypeRepo.findById(pointTypeId);

      assertPointTypeExists(pointType);

      if (data.name && data.name !== pointType.name) {
        const exists = await pointTypeRepo.findByName(data.name);

        if (exists) {
          throw new PointTypeNameExistsError();
        }
      }

      const updated = await pointTypeRepo.update(pointTypeId, data);

      assertPointTypeExists(updated);

      return updated;
    },

    async updateIcon(pointTypeId: string, body: PointTypeIconUploadBody) {
      const pointType = await pointTypeRepo.findById(pointTypeId);

      assertPointTypeExists(pointType);

      if (!imageUseCase) {
        throw new Error('ImageUseCase is required to update point type icon');
      }

      const { filename } = await imageUseCase.save(body.icon);

      const updated = await pointTypeRepo.update(pointTypeId, {
        icon: filename,
      });

      assertPointTypeExists(updated);

      return updated;
    },

    async enable(pointTypeId: string) {
      const pointType = await pointTypeRepo.findById(pointTypeId);

      assertPointTypeExists(pointType);

      if (!shouldEnablePointType(pointType)) {
        return pointType;
      }

      return pointTypeRepo.updateStatus(pointTypeId, 'active');
    },

    async disable(pointTypeId: string) {
      const pointType = await pointTypeRepo.findById(pointTypeId);

      assertPointTypeExists(pointType);

      if (!shouldDisablePointType(pointType)) {
        return pointType;
      }

      return pointTypeRepo.updateStatus(pointTypeId, 'disabled');
    },

    list() {
      return pointTypeRepo.list();
    },
  }),
  { debugName: 'PointTypeUseCase' },
);

export type PointTypeUseCase = InferInput<typeof pointTypeUseCase>;
