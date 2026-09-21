import { SQL } from 'bun';
import type Elysia from 'elysia';
import { ValidationError } from 'elysia';

import type { AppLogger } from '#infrastructure/logger';

/**
 * 统一 HTTP 错误映射适配器。
 *
 * 日志器由 App 组合根显式传入, 基础设施不读取环境变量或全局单例。
 */
export function createErrorHandler(logger: Pick<AppLogger, 'error'>) {
  return function errorHandler<T extends Elysia>(app: T): T {
    app.onError(({ error, status, code }) => {
      if (error instanceof ValidationError) {
        return status(422, error.valueError?.message ?? '参数错误');
      }

      if (code === 500 || code === 'UNKNOWN' || error instanceof SQL.PostgresError) {
        logger.error(error);
        return status(500, '服务器内部错误');
      }
    });

    return app;
  };
}
