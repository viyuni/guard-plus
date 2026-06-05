import * as v from 'valibot';

import { bilibiliUid, emptyable, loginPassword, pageQuery, password, username } from './common';

/**
 * 管理员角色 Schema
 */
export const AdminRoleSchema = v.pipe(
  v.picklist(['admin', 'superAdmin'], '请选择有效的管理员角色'),
  v.description('管理员角色'),
);

export type AdminRole = v.InferOutput<typeof AdminRoleSchema>;

/**
 * 管理员列表分页查询 Query Schema
 */
export const AdminPageQuerySchema = pageQuery;

export type AdminPageQuery = v.InferOutput<typeof AdminPageQuerySchema>;

/**
 * 管理员 ID Params Schema
 */
export const AdminIdParamsSchema = v.object({
  adminId: v.pipe(v.string('请输入管理员 ID'), v.description('管理员 ID')),
});

/**
 * 创建管理员请求参数 Schema
 */
export const AdminCreateSchema = v.object({
  uid: bilibiliUid,
  username: username,
  password: password,
  remark: v.optional(
    emptyable(
      v.pipe(
        v.string('请输入备注'),
        v.maxLength(500, '备注不能超过 500 个字符'),
        v.description('备注'),
      ),
    ),
  ),
});

export type AdminCreateBody = v.InferOutput<typeof AdminCreateSchema>;

/**
 * 更新管理员请求参数 Schema
 */
export const SuperAdminUpdateSchema = v.object({
  username: v.optional(username),
  remark: v.nullish(
    emptyable(
      v.pipe(
        v.string('请输入备注'),
        v.maxLength(500, '备注不能超过 500 个字符'),
        v.description('备注'),
      ),
    ),
  ),
});

export type SuperAdminUpdateBody = v.InferOutput<typeof SuperAdminUpdateSchema>;

/**
 * 更新管理员请求参数 Schema
 */
export const AdminUpdateSchema = v.object({
  username: v.optional(username),
});

export type AdminUpdateBody = v.InferOutput<typeof AdminUpdateSchema>;

export const AdminUpdatePasswordSchema = v.object({
  oldPassword: password,
  newPassword: password,
});

export type AdminUpdatePasswordBody = v.InferOutput<typeof AdminUpdatePasswordSchema>;

/**


/**
 * 管理员登录请求参数 Schema
 */
export const AdminLoginSchema = v.object({
  uid: bilibiliUid,
  password: loginPassword,
});

export type AdminLoginBody = v.InferOutput<typeof AdminLoginSchema>;
