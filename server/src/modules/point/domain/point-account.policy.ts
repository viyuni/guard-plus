import type { PointAccount } from '#db/schema';

import {
  PointAccountBannedError,
  PointAccountSuspendedError,
  PointBalanceInsufficientError,
} from './errors';

export function assertPointAccountCanIncrease(account: PointAccount) {
  if (account.status === 'banned') {
    throw new PointAccountBannedError();
  }
}

export function assertPointAccountCanConsume(account: PointAccount) {
  if (account.status === 'suspended') {
    throw new PointAccountSuspendedError();
  }

  if (account.status === 'banned') {
    throw new PointAccountBannedError();
  }
}

export function assertSufficientPointBalance(account: PointAccount, amount: number) {
  if (account.balance < amount) {
    throw new PointBalanceInsufficientError();
  }
}
