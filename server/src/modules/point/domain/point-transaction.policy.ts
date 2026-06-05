import type { PointTransaction, PointTransactionType } from '#db/schema';

import { InvalidPointTransactionDeltaError, PointTransactionAlreadyReversedError } from './errors';
import { POINT_CHANGE_SOURCE_TYPE } from './types';

export class PointTransactionPolicy {
  static assertDeltaMatchesType(type: PointTransactionType, delta: number) {
    if (type === 'grant' && delta <= 0) {
      throw new InvalidPointTransactionDeltaError('发放积分 delta 必须大于 0');
    }

    if (type === 'consume' && delta >= 0) {
      throw new InvalidPointTransactionDeltaError('消费积分 delta 必须小于 0');
    }

    if (type === 'refund' && delta <= 0) {
      throw new InvalidPointTransactionDeltaError('退款返还积分 delta 必须大于 0');
    }

    if (type === 'adjust' && delta === 0) {
      throw new InvalidPointTransactionDeltaError('管理员调整 delta 不能为 0');
    }

    if (type === 'reversal' && delta === 0) {
      throw new InvalidPointTransactionDeltaError('冲正流水 delta 不能为 0');
    }
  }

  static assertCanReverse(
    original: PointTransaction,
    existingReversal: PointTransaction | null | undefined,
  ) {
    if (original.reversalOfTransactionId || existingReversal) {
      throw new PointTransactionAlreadyReversedError();
    }
  }

  static reversalDelta(transaction: PointTransaction) {
    return -transaction.delta;
  }

  static resolveTitle(input: {
    type: PointTransactionType;
    delta: number;
    sourceType: string | null;
  }) {
    switch (input.sourceType) {
      case POINT_CHANGE_SOURCE_TYPE.OrderConsume:
        return '兑换商品';

      case POINT_CHANGE_SOURCE_TYPE.OrderRefund:
        return '订单退款';

      case POINT_CHANGE_SOURCE_TYPE.AdminAdjustment:
        return input.delta >= 0 ? '管理员发放' : '管理员扣减';

      case POINT_CHANGE_SOURCE_TYPE.Reversal:
        return '积分冲正';

      case POINT_CHANGE_SOURCE_TYPE.GuardEvent:
        return '大航海奖励';

      case POINT_CHANGE_SOURCE_TYPE.Conversion:
        return input.delta >= 0 ? '积分转换转入' : '积分转换转出';
    }

    switch (input.type) {
      case 'grant':
        return '获得积分';

      case 'consume':
        return '消耗积分';

      case 'refund':
        return '积分退回';

      case 'adjust':
        return input.delta >= 0 ? '积分调整增加' : '积分调整扣减';

      case 'reversal':
        return '积分冲正';
    }
  }
}
