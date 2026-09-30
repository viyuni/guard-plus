import type { BiliEventPageQuery } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenex';

import BiliEventModule from '#modules/bili-event';

/** 大航海事件只读查询能力。 */
export const RewardQuery = ripple(
  'RewardQuery',
  {
    BiliEventRepo: BiliEventModule.BiliEventRepo,
  },
  ({ BiliEventRepo }) => ({
    pageBiliGuardEvents(query: BiliEventPageQuery) {
      return BiliEventRepo.pageBiliGuard(query);
    },
  }),
);

export type RewardQuery = InferInput<typeof RewardQuery>;
