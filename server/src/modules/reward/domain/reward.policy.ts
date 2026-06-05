import { AppError } from '#utils';

import type { BiliGuardRewardEvent } from './types';

export class RewardPolicy {
  static calculateBiliGuardPoints(basePoints: number, event: BiliGuardRewardEvent) {
    return basePoints * event.totalNormalized;
  }

  static getBiliGuardEventTime(event: BiliGuardRewardEvent) {
    if (event.timestamp > 9_999_999_999) {
      return new Date(event.timestamp);
    }

    return new Date(event.timestampNormalized);
  }

  static getErrorSnapshot(error: unknown) {
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
}
