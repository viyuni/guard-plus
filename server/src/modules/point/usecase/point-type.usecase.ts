import type {
  CreatePointTypeBody,
  PointTypeIconUploadBody,
  UpdatePointTypeBody,
} from '@shared/schema/point-type';

import type { DbExecutor } from '#db';
import type { ImageUseCase } from '#modules/image';

import { PointTypeNameExistsError, PointTypePolicy } from '../domain';
import { PointTypeRepository } from '../repository';

export interface PointTypeUseCaseDeps {
  pointTypeRepo: PointTypeRepository;
  imageUseCase?: ImageUseCase;
}

export class PointTypeUseCase {
  constructor(private readonly deps: PointTypeUseCaseDeps) {}

  async get(pointTypeId: string) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    PointTypePolicy.assertExists(pointType);

    return pointType;
  }

  async getAvailableById(pointTypeId: string, db?: DbExecutor) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId, db);

    PointTypePolicy.assertAvailableExists(pointType);

    return pointType;
  }

  async create(data: CreatePointTypeBody) {
    const exists = await this.deps.pointTypeRepo.findByName(data.name);

    if (exists) {
      throw new PointTypeNameExistsError();
    }

    return this.deps.pointTypeRepo.create({ ...data, status: 'disabled' });
  }

  async update(pointTypeId: string, data: UpdatePointTypeBody) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    PointTypePolicy.assertExists(pointType);

    if (data.name && data.name !== pointType.name) {
      const exists = await this.deps.pointTypeRepo.findByName(data.name);

      if (exists) {
        throw new PointTypeNameExistsError();
      }
    }

    const updated = await this.deps.pointTypeRepo.update(pointTypeId, data);

    PointTypePolicy.assertExists(updated);

    return updated;
  }

  async updateIcon(pointTypeId: string, body: PointTypeIconUploadBody) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    PointTypePolicy.assertExists(pointType);

    if (!this.deps.imageUseCase) {
      throw new Error('ImageUseCase is required to update point type icon');
    }

    const { filename } = await this.deps.imageUseCase.save(body.icon);
    const updated = await this.deps.pointTypeRepo.update(pointTypeId, {
      icon: filename,
    });

    PointTypePolicy.assertExists(updated);

    return updated;
  }

  async enable(pointTypeId: string) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    PointTypePolicy.assertExists(pointType);

    if (!PointTypePolicy.shouldEnable(pointType)) {
      return pointType;
    }

    return this.deps.pointTypeRepo.updateStatus(pointTypeId, 'active');
  }

  async disable(pointTypeId: string) {
    const pointType = await this.deps.pointTypeRepo.findById(pointTypeId);

    PointTypePolicy.assertExists(pointType);

    if (!PointTypePolicy.shouldDisable(pointType)) {
      return pointType;
    }

    return this.deps.pointTypeRepo.updateStatus(pointTypeId, 'disabled');
  }

  list() {
    return this.deps.pointTypeRepo.list();
  }
}
