import * as v from 'valibot';

import {
  bilibiliUid,
  dateRange,
  dateish,
  emptyable,
  keyword,
  numeric,
  pageQuery,
  POSTGRES_INTEGER_MAX,
  POSTGRES_INTEGER_MIN,
} from './common';

/**
 * 积分奖励规则 ID Params Schema。
 */
export const RewardRuleIdParamsSchema = v.object({
  rewardRuleId: v.pipe(v.string('请输入积分奖励规则 ID'), v.description('积分奖励规则 ID')),
});

export type RewardRuleIdParams = v.InferOutput<typeof RewardRuleIdParamsSchema>;

/**
 * B站事件 ID Params Schema。
 */
export const BiliEventIdParamsSchema = v.object({
  biliEventId: v.pipe(v.string('请输入 B站事件 ID'), v.description('B站事件 ID')),
});

export type BiliEventIdParams = v.InferOutput<typeof BiliEventIdParamsSchema>;

export const BiliEventPageQuerySchema = v.object({
  keyword: v.optional(keyword),
  status: v.optional(
    v.picklist(['processing', 'succeeded', 'failed', 'ignored'], '请选择有效的事件状态'),
  ),
  ...dateRange.entries,
  ...pageQuery.entries,
});

export type BiliEventPageQuery = v.InferOutput<typeof BiliEventPageQuerySchema>;

/**
 * 积分奖励规则名称 Schema。
 */
const RewardRuleNameSchema = v.pipe(
  v.string('请输入积分奖励规则名称'),
  v.minLength(2, '积分奖励规则名称不能少于 2 个字符'),
  v.maxLength(80, '积分奖励规则名称不能超过 80 个字符'),
  v.description('积分奖励规则名称'),
);

/**
 * 积分奖励规则描述 Schema。
 */
const RewardRuleDescriptionSchema = v.pipe(
  v.string('请输入备注'),
  v.maxLength(200, '备注不能超过 200 个字符'),
  v.description('备注'),
);

/**
 * 互斥分组 Schema。
 */
const RewardRuleGroupSchema = v.pipe(
  v.string('请输入互斥分组'),
  v.minLength(1, '互斥分组不能为空'),
  v.maxLength(80, '互斥分组不能超过 80 个字符'),
  v.description('互斥分组'),
);

/**
 * 大航海类型。
 *
 * 1：总督
 * 2：提督
 * 3：舰长
 */
export const BiliGuardType = {
  /** 总督 */
  Zongdu: 1,

  /** 提督 */
  Tidu: 2,

  /** 舰长 */
  Jianzhang: 3,
} as const;

/**
 * 大航海类型 Schema。
 */
export const BiliGuardTypeSchema = v.pipe(
  v.enum(BiliGuardType, '请选择有效的大航海类型'),
  v.description('大航海类型'),
);

export type BiliGuardType = v.InferOutput<typeof BiliGuardTypeSchema>;

const BiliGuardTypeInputSchema = v.pipe(
  v.union([BiliGuardTypeSchema, v.pipe(v.picklist(['1', '2', '3']), v.toNumber())]),
  v.enum(BiliGuardType, '请选择有效的大航海类型'),
  v.description('大航海类型'),
);

/**
 * 手动创建大航海事件 Body Schema。
 */
export const CreateManualBiliGuardEventSchema = v.object({
  uid: bilibiliUid,
  total: v.pipe(
    numeric('请输入数量'),
    v.integer('数量必须是整数'),
    v.minValue(1, '数量必须大于 0'),
    v.maxValue(POSTGRES_INTEGER_MAX, '数量过大'),
    v.description('数量'),
  ),
  openedAt: v.pipe(dateish('请输入开通时间'), v.description('开通时间')),
  guardType: BiliGuardTypeInputSchema,
});

export type CreateManualBiliGuardEventBody = v.InferOutput<typeof CreateManualBiliGuardEventSchema>;

/**
 * 大航海奖励条件 Schema。
 */
export const BiliGuardRewardConditionSchema = v.object({
  type: v.pipe(v.literal('biliGuard', '请选择有效的条件类型'), v.description('条件类型')),
  guardTypes: v.optional(
    v.pipe(v.array(BiliGuardTypeSchema, '请选择大航海类型'), v.description('大航海类型')),
  ),
});

export type BiliGuardRewardCondition = v.InferOutput<typeof BiliGuardRewardConditionSchema>;

/**
 * 积分奖励规则条件 Schema。
 */
export const RewardRuleConditionSchema = BiliGuardRewardConditionSchema;

export type RewardRuleCondition = v.InferOutput<typeof RewardRuleConditionSchema>;

/**
 * 创建积分奖励规则 Body Schema。
 */
export const CreateRewardRuleSchema = v.object({
  name: RewardRuleNameSchema,
  description: v.optional(emptyable(RewardRuleDescriptionSchema)),

  conditions: RewardRuleConditionSchema,

  pointTypeId: v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID')),
  points: v.pipe(
    v.number('请输入奖励积分数'),
    v.integer('奖励积分数必须是整数'),
    v.minValue(1, '奖励积分数必须大于 0'),
    v.maxValue(POSTGRES_INTEGER_MAX, '奖励积分数过大'),
    v.description('奖励积分数'),
  ),

  enabled: v.optional(v.pipe(v.boolean('请选择是否启用'), v.description('是否启用'))),
  group: v.optional(emptyable(RewardRuleGroupSchema)),

  priority: v.optional(
    v.pipe(
      v.number('请输入优先级'),
      v.integer('优先级必须是整数'),
      v.minValue(POSTGRES_INTEGER_MIN, '优先级过小'),
      v.maxValue(POSTGRES_INTEGER_MAX, '优先级过大'),
      v.description('优先级，数字越小优先级越高'),
    ),
  ),
  ...dateRange.entries,
});

export type CreateRewardRuleBody = v.InferOutput<typeof CreateRewardRuleSchema>;

/**
 * 更新积分奖励规则 Body Schema。
 */
export const UpdateRewardRuleSchema = v.object({
  name: v.optional(RewardRuleNameSchema),
  description: v.nullish(emptyable(RewardRuleDescriptionSchema)),

  conditions: v.optional(RewardRuleConditionSchema),

  pointTypeId: v.optional(v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID'))),
  points: v.optional(
    v.pipe(
      v.number('请输入奖励积分数'),
      v.integer('奖励积分数必须是整数'),
      v.minValue(1, '奖励积分数必须大于 0'),
      v.maxValue(POSTGRES_INTEGER_MAX, '奖励积分数过大'),
      v.description('奖励积分数'),
    ),
  ),

  enabled: v.optional(v.pipe(v.boolean('请选择是否启用'), v.description('是否启用'))),
  group: v.nullish(emptyable(RewardRuleGroupSchema)),

  priority: v.optional(
    v.pipe(
      v.number('请输入优先级'),
      v.integer('优先级必须是整数'),
      v.minValue(POSTGRES_INTEGER_MIN, '优先级过小'),
      v.maxValue(POSTGRES_INTEGER_MAX, '优先级过大'),
      v.description('优先级，数字越小优先级越高'),
    ),
  ),
  ...dateRange.entries,
});

export type UpdateRewardRuleInput = v.InferInput<typeof UpdateRewardRuleSchema>;
export type UpdateRewardRuleBody = v.InferOutput<typeof UpdateRewardRuleSchema>;
