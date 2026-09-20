import type { PointType } from '#db/schema';
import { assertPresent } from '#utils';

import { PointTypeNotFoundError, PointTypeUnavailableError } from './errors';

export type AvailablePointType = PointType & {
  status: 'active';
};

export function isPointTypeAvailable(
  pointType: PointType | null | undefined,
): pointType is AvailablePointType {
  return pointType?.status === 'active';
}

export function assertPointTypeExists(
  pointType: PointType | null | undefined,
): asserts pointType is PointType {
  assertPresent(pointType, () => new PointTypeNotFoundError());
}

export function assertPointTypeAvailable(
  pointType: PointType | null | undefined,
): asserts pointType is AvailablePointType {
  if (!isPointTypeAvailable(pointType)) {
    throw new PointTypeUnavailableError();
  }
}

export function assertPointTypeAvailableExists(
  pointType: PointType | null | undefined,
): asserts pointType is AvailablePointType {
  assertPointTypeExists(pointType);
  assertPointTypeAvailable(pointType);
}

export function shouldEnablePointType(pointType: PointType) {
  return pointType.status !== 'active';
}

export function shouldDisablePointType(pointType: PointType) {
  return pointType.status !== 'disabled';
}
