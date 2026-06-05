import type { PointAccount } from '#db/schema';

import {
  PointAccountBannedError,
  PointAccountSuspendedError,
  PointBalanceInsufficientError,
} from './errors';

export class PointAccountPolicy {
  static assertCanIncrease(account: PointAccount) {
    if (account.status === 'banned') {
      throw new PointAccountBannedError();
    }
  }

  static assertCanConsume(account: PointAccount) {
    if (account.status === 'suspended') {
      throw new PointAccountSuspendedError();
    }

    if (account.status === 'banned') {
      throw new PointAccountBannedError();
    }
  }

  static assertSufficientBalance(account: PointAccount, amount: number) {
    if (account.balance < amount) {
      throw new PointBalanceInsufficientError();
    }
  }
}
