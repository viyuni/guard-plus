import { AppError } from '#utils';

import type { BiliGuardRewardEvent } from './types';

export class RewardPolicy {
  static calculateBiliGuardPoints(basePoints: number, event: BiliGuardRewardEvent) {
    return basePoints * event.quantityNormalized;
  }

  static getBiliGuardEventTime(event: BiliGuardRewardEvent) {
    return new Date(event.occurredAt);
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
