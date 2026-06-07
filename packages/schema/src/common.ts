import * as v from 'valibot';

export const POSTGRES_INTEGER_MIN = -2_147_483_648;
export const POSTGRES_INTEGER_MAX = 2_147_483_647;

export {
  array,
  boolean,
  check,
  date,
  description,
  email,
  enum,
  file,
  integer,
  intersect,
  literal,
  maxLength,
  maxSize,
  maxValue,
  mimeType,
  minLength,
  minValue,
  nonEmpty,
  nullish,
  number,
  object,
  optional,
  parseJson,
  picklist,
  pipe,
  regex,
  string,
  toNumber,
  transform,
  trim,
  union,
  uuid,
} from 'valibot';
export type { BaseSchema, InferInput, InferOutput } from 'valibot';

/**
 * empty string
 */
export function emptyable<TSchema extends v.BaseSchema<any, any, any>>(schema: TSchema) {
  return v.union([schema, v.pipe(v.literal(''))]);
}

/**
 * 数字输入 Schema。
 *
 * 兼容 JSON 请求中的 number 和 multipart/form-data 中的数字字符串。
 */
export const numeric = (message?: string) =>
  v.union([
    v.number(message),
    v.pipe(v.string(message), v.regex(/^-?\d+(\.\d+)?$/, message), v.toNumber(message)),
  ]);

/**
 * 布尔输入 Schema。
 *
 * 兼容 JSON 请求中的 boolean 和 multipart/form-data 中的布尔字符串。
 */
export const boolish = (message?: string) =>
  v.union([
    v.boolean(message),
    v.pipe(
      v.picklist(['true', 'false'], message),
      v.transform(value => value === 'true'),
    ),
  ]);

/**
 * 日期输入 Schema。
 *
 * 兼容前端表单中的 Date 和 JSON 请求中的 ISO 日期字符串。
 */
export const dateish = (message?: string) =>
  v.union([
    v.date(message),
    v.pipe(
      v.string(message),
      v.trim(),
      // 避免由于序列化导致带有 ""
      v.transform(value => value.replace(/^"|"$/g, '')),
      v.toDate(message),
    ),
  ]);

/**
 * 端口 Schema
 * @param defaultPort
 * @returns
 */
export const port = (message?: string) =>
  v.pipe(numeric(message), v.integer(message), v.minValue(0), v.maxValue(65535));

/**
 * 用户名 Schema
 */
export const username = v.pipe(
  v.string('请输入用户名'),
  v.nonEmpty('用户名不能为空'),
  v.minLength(3, '用户名不能少于 3 个字符'),
  v.maxLength(32, '用户名不能超过 32 个字符'),
  v.regex(/^[\p{Script=Han}A-Za-z0-9_-]+$/u, '用户名只能包含中文、字母、数字、下划线和连字符'),
  v.description('用户名'),
);

/**
 * UID Schema
 */
export const bilibiliUid = v.pipe(
  v.string('请输入 UID'),
  v.minLength(4, 'UID 不能少于 4 个字符'),
  v.maxLength(32, 'UID 不能超过 32 个字符'),
  v.regex(/^[0-9]+$/, 'UID 只能包含数字'),
  v.description('UID'),
);

/**
 * 密码 Schema
 */
export const password = v.pipe(
  v.string('请输入密码'),
  v.regex(/^(?=.*[A-Za-z])(?=.*\d).{12,32}$/, '密码长度需为 12 到 32 个字符，且包含字母和数字'),
  v.description('密码'),
);

export const loginPassword = v.pipe(
  v.string('请输入密码'),
  v.minLength(12, '请输入正确的密码'),
  v.description('密码'),
);

/**
 * 路由参数 ID Schema
 */
export const IdParamSchema = v.object({
  id: v.pipe(v.string('请输入 ID'), v.description('ID')),
});

/**
 * 分页查询参数 Schema
 */
export const pageQuery = v.object({
  page: v.optional(
    v.pipe(
      v.union([
        v.number('请输入页码'),
        v.pipe(
          v.string('请输入页码'),
          v.regex(/^-?\d+(\.\d+)?$/, '页码必须是数字'),
          v.toNumber('页码必须是数字'),
        ),
      ]),
      v.integer('页码必须是整数'),
      v.minValue(1, '页码不能小于 1'),
      v.description('页码'),
    ),
  ),
  pageSize: v.optional(
    v.pipe(
      v.union([
        v.number('请输入每页数量'),
        v.pipe(
          v.string('请输入每页数量'),
          v.regex(/^-?\d+(\.\d+)?$/, '每页数量必须是数字'),
          v.toNumber('每页数量必须是数字'),
        ),
      ]),
      v.integer('每页数量必须是整数'),
      v.minValue(1, '每页数量不能小于 1'),
      v.maxValue(50, '每页数量不能超过 50'),
      v.description('每页数量'),
    ),
  ),
});

export type PageQuery = v.InferOutput<typeof pageQuery>;

/**
 * 日期范围参数 Schema。
 */
export const dateRange = v.object({
  startAt: v.nullish(v.pipe(dateish('请输入开始时间'), v.description('开始时间'))),
  endAt: v.nullish(v.pipe(dateish('请输入结束时间'), v.description('结束时间'))),
});

/**
 * 搜索关键词 Schema
 *
 * Rule:
 * - 搜索关键词不能为空
 * - 搜索关键词长度不能超过 50 个字符
 */
export const keyword = emptyable(
  v.pipe(
    v.string('请输入搜索关键词'),
    v.minLength(1, '搜索关键词不能为空'),
    v.maxLength(50, '搜索关键词不能超过 50 个字符'),
    v.description('搜索关键词'),
  ),
);

/**
 * 请求唯一随机值 Body 参数 Schema。
 *
 * 用于由客户端为一次操作生成唯一随机值，服务端可结合业务场景、
 * 用户 ID 等信息生成最终的幂等键，避免重复提交导致重复执行业务。
 *
 * 规则：
 * - `nonce` 为必填参数
 * - 必须是合法 UUID 字符串
 * - 同一业务场景下，相同 `nonce` 应被视为同一次请求
 */
export const nonce = v.pipe(
  v.string('请输入请求唯一随机值'),
  v.uuid('请求唯一随机值必须是合法 UUID'),
  v.description('请求唯一随机值'),
);

/**
 * 通用备注 Schema。
 */
export const remark = v.pipe(
  v.string('请输入备注'),
  v.maxLength(100, '备注不能超过 100 个字符'),
  v.description('备注'),
);

/**
 * 参数错误信息 Schema
 */
export const errorResponse = v.object({
  code: v.pipe(v.string('请输入错误码'), v.description('错误码')),
  message: v.pipe(v.string('请输入错误消息'), v.description('错误消息')),
  details: v.array(v.string()),
});

export const envEmails = v.pipe(
  v.string(),
  v.transform(input => input.split(',').filter(Boolean)),
  v.array(v.pipe(v.string(), v.trim(), v.email())),
);

export const envOrigins = v.pipe(
  v.string(),
  v.transform(input => input.split(',').filter(Boolean)),
  v.array(v.pipe(v.string(), v.trim(), v.url())),
);
