import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type {
  CreateManualBiliGuardEventBody,
  CreateRewardRuleBody,
  UpdateRewardRuleBody,
} from '@shared/schema/reward';

import { REWARD_QUERY_KEYS } from './queries';

function useInvalidateRewards() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: REWARD_QUERY_KEYS.root });
}

export const useCreateRewardRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分规则已创建',
    },
    mutation(body: CreateRewardRuleBody) {
      return $api.rewards.rules.post(body);
    },
    onSettled: invalidateRewards,
  });
});

export const useUpdateRewardRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分规则已更新',
    },
    mutation(input: { rewardRuleId: string; body: UpdateRewardRuleBody }) {
      return $api.rewards.rules({ rewardRuleId: input.rewardRuleId }).put(input.body);
    },
    onSettled: invalidateRewards,
  });
});

export const useEnableRewardRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分规则已启用',
    },
    mutation(rewardRuleId: string) {
      return $api.rewards.rules({ rewardRuleId }).enable.patch();
    },
    onSettled: invalidateRewards,
  });
});

export const useDisableRewardRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分规则已停用',
    },
    mutation(rewardRuleId: string) {
      return $api.rewards.rules({ rewardRuleId }).disable.patch();
    },
    onSettled: invalidateRewards,
  });
});

export const useDeleteRewardRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分规则已删除',
    },
    mutation(rewardRuleId: string) {
      return $api.rewards.rules({ rewardRuleId }).delete();
    },
    onSettled: invalidateRewards,
  });
});

export const useReplayBiliGuardReward = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '大航海奖励已回放',
    },
    mutation(biliEventId: string) {
      return $api.rewards.biliGuard({ biliEventId }).replay.post();
    },
    onSettled: invalidateRewards,
  });
});

export const useCreateManualBiliGuardEvent = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidateRewards = useInvalidateRewards();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '大航海事件已创建',
    },
    mutation(body: CreateManualBiliGuardEventBody) {
      return $api.rewards.biliGuard.manual.post(body);
    },
    onSettled: invalidateRewards,
  });
});
