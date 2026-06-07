import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type { ReversalPointTransactionBody } from '@shared/schema/point-account';
import type {
  ConvertPointBody,
  CreatePointConversionRuleBody,
  UpdatePointConversionRuleBody,
} from '@shared/schema/point-conversion';
import type {
  CreatePointTypeBody,
  PointTypeIconUploadBody,
  UpdatePointTypeBody,
} from '@shared/schema/point-type';

import { POINT_QUERY_KEYS } from './queries';

function useInvalidatePoints() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: POINT_QUERY_KEYS.root });
}

export const useReversePointTransaction = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分流水已冲正',
    },
    mutation(body: ReversalPointTransactionBody) {
      return $api.points.transactions.reversal.patch(body);
    },
    onSettled: invalidatePoints,
  });
});

export const useCreatePointType = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分类型已创建',
    },
    mutation(body: CreatePointTypeBody) {
      return $api.points.types.post(body);
    },
    onSettled: invalidatePoints,
  });
});

export const useUpdatePointType = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分类型已更新',
    },
    mutation(input: { pointTypeId: string; body: UpdatePointTypeBody }) {
      return $api.points.types({ pointTypeId: input.pointTypeId }).put(input.body);
    },
    onSettled: invalidatePoints,
  });
});

export const useUpdatePointTypeIcon = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分类型图标已更新',
    },
    mutation(input: { pointTypeId: string; body: PointTypeIconUploadBody }) {
      return $api.points.types({ pointTypeId: input.pointTypeId }).icon.put(input.body);
    },
    onSettled: invalidatePoints,
  });
});

export const useEnablePointType = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分类型已启用',
    },
    mutation(pointTypeId: string) {
      return $api.points.types({ pointTypeId }).enable.patch();
    },
    onSettled: invalidatePoints,
  });
});

export const useDisablePointType = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分类型已停用',
    },
    mutation(pointTypeId: string) {
      return $api.points.types({ pointTypeId }).disable.patch();
    },
    onSettled: invalidatePoints,
  });
});

export const useCreatePointConversionRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换规则已创建',
    },
    mutation(body: CreatePointConversionRuleBody) {
      return $api.points.conversions.post(body);
    },
    onSettled: invalidatePoints,
  });
});

export const useUpdatePointConversionRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换规则已更新',
    },
    mutation(input: { pointConversionRuleId: string; body: UpdatePointConversionRuleBody }) {
      return $api.points
        .conversions({ pointConversionRuleId: input.pointConversionRuleId })
        .put(input.body);
    },
    onSettled: invalidatePoints,
  });
});

export const useEnablePointConversionRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换规则已启用',
    },
    mutation(pointConversionRuleId: string) {
      return $api.points.conversions({ pointConversionRuleId }).enable.patch();
    },
    onSettled: invalidatePoints,
  });
});

export const useDisablePointConversionRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换规则已停用',
    },
    mutation(pointConversionRuleId: string) {
      return $api.points.conversions({ pointConversionRuleId }).disable.patch();
    },
    onSettled: invalidatePoints,
  });
});

export const useDeletePointConversionRule = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换规则已删除',
    },
    mutation(pointConversionRuleId: string) {
      return $api.points.conversions({ pointConversionRuleId }).delete();
    },
    onSettled: invalidatePoints,
  });
});

export const useConvertPoint = defineMutation(() => {
  const { $api } = useNuxtApp();
  const invalidatePoints = useInvalidatePoints();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换已执行',
    },
    mutation(body: ConvertPointBody) {
      return $api.points.conversions.convert.post(body);
    },
    onSettled: invalidatePoints,
  });
});
