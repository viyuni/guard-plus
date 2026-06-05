import type { RewardRule } from '#db/schema';

import { RewardRuleTimeRangeInvalidError } from './errors';
import type { BiliGuardRewardEvent } from './types';

export class RewardRulePolicy {
  static isActive(rule: RewardRule, now = new Date()) {
    if (!rule.enabled) {
      return false;
    }

    if (rule.startAt && rule.startAt > now) {
      return false;
    }

    if (rule.endAt && rule.endAt <= now) {
      return false;
    }

    return true;
  }

  static matchesBiliGuard(rule: RewardRule, event: BiliGuardRewardEvent) {
    const { conditions } = rule;

    if (conditions.type !== 'biliGuard') {
      return false;
    }

    if (!conditions.guardTypes?.length) {
      return false;
    }

    if (
      !conditions.guardTypes.includes(event.guardType as (typeof conditions.guardTypes)[number])
    ) {
      return false;
    }

    return true;
  }

  static pickEffectiveRules(rules: RewardRule[]) {
    const stackableRules: RewardRule[] = [];
    const groupedRules = new Map<string, RewardRule[]>();

    for (const rule of rules) {
      if (!rule.group) {
        stackableRules.push(rule);
        continue;
      }

      const groupRules = groupedRules.get(rule.group) ?? [];
      groupRules.push(rule);
      groupedRules.set(rule.group, groupRules);
    }

    for (const groupRules of groupedRules.values()) {
      groupRules.sort(
        (a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime(),
      );
      stackableRules.push(groupRules[0]!);
    }

    return stackableRules.sort(
      (a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  static assertValidTimeRange(input: { startAt?: Date | null; endAt?: Date | null }) {
    if (input.startAt && input.endAt && input.startAt >= input.endAt) {
      throw new RewardRuleTimeRangeInvalidError();
    }
  }
}
