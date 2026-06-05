import * as v from 'valibot';

import { emptyable, numeric, POSTGRES_INTEGER_MAX, POSTGRES_INTEGER_MIN } from './common';

/**
 * 积分类型 ID Params Schema。
 */
export const PointTypeIdParamsSchema = v.object({
  pointTypeId: v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID')),
});

export type PointTypeIdParams = v.InferOutput<typeof PointTypeIdParamsSchema>;

/**
 * 积分类型状态。
 */
export const PointTypeStatus = {
  Active: 'active',
  Disabled: 'disabled',
} as const;

/**
 * 积分类型状态 Schema。
 */
export const PointTypeStatusSchema = v.pipe(
  v.enum(PointTypeStatus, '请选择有效的积分类型状态'),
  v.description('积分类型状态'),
);

export type PointTypeStatus = v.InferOutput<typeof PointTypeStatusSchema>;

/**
 * 积分类型名称 Schema。
 */
const PointTypeNameSchema = v.pipe(
  v.string('请输入积分类型名称'),
  v.minLength(2, '积分类型名称不能少于 2 个字符'),
  v.maxLength(50, '积分类型名称不能超过 50 个字符'),
  v.description('积分类型名称'),
);

/**
 * 积分类型描述 Schema。
 */
const PointTypeDescriptionSchema = v.pipe(
  v.string('请输入积分类型描述'),
  v.maxLength(50, '积分类型描述不能超过 50 个字符'),
  v.description('积分类型描述'),
);

/**
 * 积分类型排序值 Schema。
 */
const PointTypeSortSchema = v.pipe(
  numeric('请输入排序值'),
  v.integer('排序值必须是整数'),
  v.minValue(POSTGRES_INTEGER_MIN, '排序值过小'),
  v.maxValue(POSTGRES_INTEGER_MAX, '排序值过大'),
  v.description('排序值'),
);

/**
 * 可空积分类型排序值 Schema。
 */
const NullablePointTypeSortSchema = v.pipe(
  v.union([PointTypeSortSchema, v.literal(''), v.null()]),
  v.transform(value => (value === '' ? null : value)),
  v.description('排序值'),
);

/**
 * 积分类型图标文件 Schema。
 */
const PointTypeIconFileSchema = v.pipe(
  v.file('请选择积分类型图标'),
  v.mimeType(['image/jpeg', 'image/png', 'image/webp'], '积分类型图标仅支持 JPG、PNG、WebP 格式'),
  v.maxSize(1024 * 1024 * 20, '请选择一个小于 20MB 的文件'),
  v.description('积分类型图标'),
);

/**
 * 积分类型图标上传 Body Schema。
 */
export const PointTypeIconUploadSchema = v.object({
  icon: PointTypeIconFileSchema,
});

export type PointTypeIconUploadBody = v.InferOutput<typeof PointTypeIconUploadSchema>;

/**
 * 创建积分类型 Body Schema。
 */
export const CreatePointTypeSchema = v.object({
  name: PointTypeNameSchema,
  description: v.optional(emptyable(PointTypeDescriptionSchema)),
  sort: v.optional(NullablePointTypeSortSchema),
});

export type CreatePointTypeBody = v.InferOutput<typeof CreatePointTypeSchema>;

/**
 * 更新积分类型 Body Schema。
 */
export const UpdatePointTypeSchema = v.object({
  name: v.optional(PointTypeNameSchema),
  description: v.nullish(emptyable(PointTypeDescriptionSchema)),
  sort: v.optional(NullablePointTypeSortSchema),
});

export type UpdatePointTypeBody = v.InferOutput<typeof UpdatePointTypeSchema>;
