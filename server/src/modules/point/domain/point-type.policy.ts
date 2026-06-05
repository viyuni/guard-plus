import type { PointType } from '#db/schema';

import { PointTypeNotFoundError, PointTypeUnavailableError } from './errors';

export type AvailablePointType = PointType & {
  status: 'active';
};

export class PointTypePolicy {
  static isAvailable(pointType: PointType | null | undefined): pointType is AvailablePointType {
    return pointType?.status === 'active';
  }

  static assertExists(pointType: PointType | null | undefined): asserts pointType is PointType {
    if (!pointType) {
      throw new PointTypeNotFoundError();
    }
  }

  static assertAvailable(
    pointType: PointType | null | undefined,
  ): asserts pointType is AvailablePointType {
    if (!PointTypePolicy.isAvailable(pointType)) {
      throw new PointTypeUnavailableError();
    }
  }

  static assertAvailableExists(
    pointType: PointType | null | undefined,
  ): asserts pointType is AvailablePointType {
    PointTypePolicy.assertExists(pointType);
    PointTypePolicy.assertAvailable(pointType);
  }

  static shouldEnable(pointType: PointType) {
    return pointType.status !== 'active';
  }

  static shouldDisable(pointType: PointType) {
    return pointType.status !== 'disabled';
  }
}
