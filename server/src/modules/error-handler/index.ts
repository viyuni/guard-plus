import { SQL } from 'bun';
import Elysia, { ValidationError } from 'elysia';

import { logger } from '#utils/logger';

export function errorHandler<T extends Elysia>(app: T): T {
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
}
