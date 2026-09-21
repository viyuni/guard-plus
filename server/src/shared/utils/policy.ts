import type { AppError } from '../errors';

export type AppErrorFactory = () => AppError;

/**
 * 断言值既不是 null 也不是 undefined，否则抛出调用方注入的错误。
 *
 * 各领域用它表达统一的「资源不存在」语义，错误类型与文案仍由领域决定。
 */
export function assertPresent<T>(
  value: T | null | undefined,
  createError: AppErrorFactory,
): asserts value is T {
  if (value === null || value === undefined) {
    throw createError();
  }
}

/**
 * 断言时间区间有效（`startAt` 必须早于 `endAt`）。
 *
 * 任一端为 null / undefined 时视为「不限」，直接通过。
 */
export function assertTimeRange(
  startAt: Date | null | undefined,
  endAt: Date | null | undefined,
  createError: AppErrorFactory,
) {
  if (startAt && endAt && startAt >= endAt) {
    throw createError();
  }
}
