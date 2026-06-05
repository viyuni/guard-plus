import { type Guard } from '@viyuni/bevent-relay/events';

import type { BiliEventRewardItemSnapshot } from '#db/schema';

export interface BiliGuardRewardEvent extends Guard {
  isManual?: boolean;
}

export interface RewardGrantPlanItem {
  ruleSnapshot: BiliEventRewardItemSnapshot['ruleSnapshot'];
  pointTypeSnapshot: BiliEventRewardItemSnapshot['pointTypeSnapshot'];
  pointTypeId: string;
  points: number;
}

export interface RewardGrantPlan {
  items: RewardGrantPlanItem[];
}
