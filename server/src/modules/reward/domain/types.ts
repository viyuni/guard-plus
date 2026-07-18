import type { BiliEventRewardItemSnapshot } from '#db/schema';
import type { BiliGuardEventEnvelope, NormalizedBiliGuardEvent } from '#modules/bili-event';

export type BiliGuardRewardEvent = NormalizedBiliGuardEvent;
export type BiliGuardRewardEventEnvelope = BiliGuardEventEnvelope;

export interface RewardGrantPlanItem {
  ruleSnapshot: BiliEventRewardItemSnapshot['ruleSnapshot'];
  pointTypeSnapshot: BiliEventRewardItemSnapshot['pointTypeSnapshot'];
  pointTypeId: string;
  points: number;
}

export interface RewardGrantPlan {
  items: RewardGrantPlanItem[];
}
