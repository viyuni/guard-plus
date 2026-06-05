import * as v from 'valibot';

import { dateRange, emptyable, nonce, POSTGRES_INTEGER_MAX } from './common';

/**
 * 积分转换规则 ID Params Schema。
 */
export const PointConversionRuleIdParamsSchema = v.object({
  pointConversionRuleId: v.pipe(
    v.string('请输入积分转换规则 ID'),
    v.description('积分转换规则 ID'),
  ),
});

export type PointConversionRuleIdParams = v.InferOutput<typeof PointConversionRuleIdParamsSchema>;

/**
 * 积分转换规则名称 Schema。
 */
const ConversionRuleNameSchema = v.pipe(
  v.string('请输入积分转换规则名称'),
  v.minLength(2, '积分转换规则名称不能少于 2 个字符'),
  v.maxLength(80, '积分转换规则名称不能超过 80 个字符'),
  v.description('积分转换规则名称'),
);

/**
 * 积分转换规则描述 Schema。
 */
const ConversionRuleDescriptionSchema = v.pipe(
  v.string('请输入积分转换规则描述'),
  v.maxLength(200, '积分转换规则描述不能超过 200 个字符'),
  v.description('积分转换规则描述'),
);

/**
 * 积分转换规则备注 Schema。
 */
const ConversionRuleRemarkSchema = v.pipe(
  v.string('请输入备注'),
  v.maxLength(200, '备注不能超过 200 个字符'),
  v.description('备注'),
);

/**
 * 创建积分转换规则 Body Schema。
 */
export const CreatePointConversionRuleSchema = v.object({
  name: ConversionRuleNameSchema,
  description: v.optional(emptyable(ConversionRuleDescriptionSchema)),
  remark: v.optional(emptyable(ConversionRuleRemarkSchema)),

  fromPointTypeId: v.pipe(v.string('请输入来源积分类型 ID'), v.description('来源积分类型 ID')),
  toPointTypeId: v.pipe(v.string('请输入目标积分类型 ID'), v.description('目标积分类型 ID')),

  toAmount: v.pipe(
    v.number('请输入目标积分数量'),
    v.integer('目标积分数量必须是整数'),
    v.minValue(1, '目标积分数量必须大于 0'),
    v.maxValue(POSTGRES_INTEGER_MAX, '目标积分数量过大'),
    v.description('目标积分数量'),
  ),

  minConvertAmount: v.optional(
    v.pipe(
      v.number('请输入单次最小转换数量'),
      v.integer('单次最小转换数量必须是整数'),
      v.minValue(1, '单次最小转换数量必须大于 0'),
      v.maxValue(POSTGRES_INTEGER_MAX, '单次最小转换数量过大'),
      v.description('单次最小转换数量'),
    ),
  ),
  maxConvertAmount: v.optional(
    v.pipe(
      v.number('请输入单次最大转换数量'),
      v.integer('单次最大转换数量必须是整数'),
      v.minValue(1, '单次最大转换数量必须大于 0'),
      v.maxValue(POSTGRES_INTEGER_MAX, '单次最大转换数量过大'),
      v.description('单次最大转换数量'),
    ),
  ),

  enabled: v.optional(v.pipe(v.boolean('请选择是否启用'), v.description('是否启用'))),
  ...dateRange.entries,
});

export type CreatePointConversionRuleBody = v.InferOutput<typeof CreatePointConversionRuleSchema>;

/**
 * 更新积分转换规则 Body Schema。
 */
export const UpdatePointConversionRuleSchema = v.object({
  name: v.optional(ConversionRuleNameSchema),
  description: v.nullish(emptyable(ConversionRuleDescriptionSchema)),
  remark: v.nullish(emptyable(ConversionRuleRemarkSchema)),

  fromPointTypeId: v.optional(
    v.pipe(v.string('请输入来源积分类型 ID'), v.description('来源积分类型 ID')),
  ),
  toPointTypeId: v.optional(
    v.pipe(v.string('请输入目标积分类型 ID'), v.description('目标积分类型 ID')),
  ),

  toAmount: v.optional(
    v.pipe(
      v.number('请输入目标积分数量'),
      v.integer('目标积分数量必须是整数'),
      v.minValue(1, '目标积分数量必须大于 0'),
      v.maxValue(POSTGRES_INTEGER_MAX, '目标积分数量过大'),
      v.description('目标积分数量'),
    ),
  ),

  minConvertAmount: v.nullish(
    v.pipe(
      v.number('请输入单次最小转换数量'),
      v.integer('单次最小转换数量必须是整数'),
      v.minValue(1, '单次最小转换数量必须大于 0'),
      v.maxValue(POSTGRES_INTEGER_MAX, '单次最小转换数量过大'),
      v.description('单次最小转换数量'),
    ),
  ),
  maxConvertAmount: v.nullish(
    v.pipe(
      v.number('请输入单次最大转换数量'),
      v.integer('单次最大转换数量必须是整数'),
      v.minValue(1, '单次最大转换数量必须大于 0'),
      v.maxValue(POSTGRES_INTEGER_MAX, '单次最大转换数量过大'),
      v.description('单次最大转换数量'),
    ),
  ),

  enabled: v.optional(v.pipe(v.boolean('请选择是否启用'), v.description('是否启用'))),

  ...dateRange.entries,
});

export type UpdatePointConversionRuleBody = v.InferOutput<typeof UpdatePointConversionRuleSchema>;

/**
 * 积分转换 Body Schema。
 *
 * 用于用户按转换规则兑换积分。
 */
export const ConvertPointSchema = v.object({
  nonce: nonce,
  ruleId: v.pipe(v.string('请输入积分转换规则 ID'), v.description('积分转换规则 ID')),
  userId: v.pipe(v.string('请输入用户 ID'), v.description('用户 ID')),
  fromAmount: v.pipe(
    v.number('请输入来源积分数量'),
    v.integer('来源积分数量必须是整数'),
    v.minValue(1, '来源积分数量必须大于 0'),
    v.maxValue(POSTGRES_INTEGER_MAX, '来源积分数量过大'),
    v.description('来源积分数量'),
  ),
  remark: v.optional(emptyable(ConversionRuleRemarkSchema)),
});

export type ConvertPointBody = v.InferOutput<typeof ConvertPointSchema>;

/**
 * 用户积分转换 Body Schema。
 *
 * 用户 ID 从登录态中获取，不由前端提交。
 */
export const UserConvertPointSchema = v.object({
  nonce: nonce,
  ruleId: v.pipe(v.string('请输入积分转换规则 ID'), v.description('积分转换规则 ID')),
  fromAmount: v.pipe(
    v.number('请输入来源积分数量'),
    v.integer('来源积分数量必须是整数'),
    v.minValue(1, '来源积分数量必须大于 0'),
    v.maxValue(POSTGRES_INTEGER_MAX, '来源积分数量过大'),
    v.description('来源积分数量'),
  ),
  remark: v.optional(emptyable(ConversionRuleRemarkSchema)),
});

export type UserConvertPointBody = v.InferOutput<typeof UserConvertPointSchema>;
