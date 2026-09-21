import { AppError } from '#shared';

import type { BiliGuardRewardEvent } from './types';

export function calculateBiliGuardPoints(basePoints: number, event: BiliGuardRewardEvent) {
  return basePoints * event.totalNormalized;
}

export function getBiliGuardEventTime(event: BiliGuardRewardEvent) {
  if (event.timestamp > 9_999_999_999) {
    return new Date(event.timestamp);
  }

  return new Date(event.timestampNormalized);
}

export function getErrorSnapshot(error: unknown) {
  if (error instanceof AppError) {
    return {
      lastErrorCode: error.code,
      lastErrorMessage: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      lastErrorCode: error.name,
      lastErrorMessage: error.message,
    };
  }

  return {
    lastErrorCode: 'UNKNOWN_ERROR',
    lastErrorMessage: '未知错误',
  };
}
