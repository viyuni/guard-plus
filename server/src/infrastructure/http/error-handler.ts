import { SQL } from 'bun';
import type Elysia from 'elysia';
import { ValidationError } from 'elysia';

import type { AppLogger } from '#infrastructure/logger';
import { AppError } from '#shared';

import { getRequestLogFields } from './request-logging';

/**
 * 统一 HTTP 错误映射适配器。
 *
 * 日志器由 App 组合根显式传入, 基础设施不读取环境变量或全局单例。
 */
export function createErrorHandler(logger: Pick<AppLogger, 'error' | 'warn'>) {
  return function errorHandler<T extends Elysia>(app: T): T {
    app.onError(({ error, status, code, request }) => {
      const fields = getRequestLogFields(request);

      if (error instanceof ValidationError) {
        logger.warn({ ...fields, event: 'http.validation.rejected' }, '请求参数校验失败');
        return status(422, error.valueError?.message ?? '参数错误');
      }

      if (error instanceof AppError) {
        const logFields = { ...fields, event: 'http.business.failed', errorCode: error.code };

        if (error.status >= 500) {
          logger.error({ ...logFields, err: error }, '业务处理失败');
        } else {
          logger.warn(logFields, '业务请求被拒绝');
        }

        return status(error.status, error.status >= 500 ? '服务器内部错误' : error.message);
      }

      if (code === 500 || code === 'UNKNOWN' || error instanceof SQL.PostgresError) {
        logger.error({ ...fields, event: 'http.request.failed', err: error }, '请求处理异常');
        return status(500, '服务器内部错误');
      }
    });

    return app;
  };
}
