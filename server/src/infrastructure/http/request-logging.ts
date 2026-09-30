import { randomUUID } from 'node:crypto';

import Elysia from 'elysia';

import type { AppLogger } from '#infrastructure/logger';

const requests = new WeakMap<Request, { requestId: string; startedAt: number }>();

export function getRequestLogFields(request: Request) {
  return {
    requestId: requests.get(request)?.requestId,
    method: request.method,
    path: new URL(request.url).pathname,
  };
}

export function createRequestLogging(logger: AppLogger, appName: string) {
  const log = logger.child({ app: appName });

  return new Elysia({ name: `RequestLogging:${appName}` })
    .onRequest(({ request, set }) => {
      const requestId = randomUUID();
      requests.set(request, { requestId, startedAt: performance.now() });
      set.headers['x-request-id'] = requestId;
    })
    .onAfterResponse({ as: 'global' }, context => {
      const { request, set } = context;
      const state = requests.get(request);

      const statusCode =
        context.response instanceof Response ? context.response.status : Number(set.status ?? 200);

      const auth = (context as { auth?: { id: string; role: string } }).auth;

      const fields = {
        event: 'http.request.completed',
        ...getRequestLogFields(request),
        statusCode,
        actorId: auth?.id,
        actorRole: auth?.role,
        durationMs: state ? Math.round(performance.now() - state.startedAt) : undefined,
      };

      if (statusCode >= 500) {
        log.error(fields, 'HTTP 请求失败');
      } else if (statusCode >= 400) {
        log.warn(fields, 'HTTP 请求被拒绝');
      } else {
        log.info(fields, 'HTTP 请求完成');
      }
    });
}
