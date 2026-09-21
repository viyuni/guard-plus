import { isNull } from 'drizzle-orm';

/**
 * 删除时间字段为 null 的过滤条件
 */
export function deletedAtIsNull<T extends { deletedAt: any }>(table: T) {
  return isNull(table.deletedAt);
}
