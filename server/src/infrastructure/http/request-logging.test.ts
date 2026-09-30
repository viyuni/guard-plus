import { describe, expect, test } from 'bun:test';

import Elysia from 'elysia';

import { createLogger } from '#infrastructure/logger';
import { BadRequestError } from '#shared';

import { createErrorHandler } from './error-handler';
import { createRequestLogging } from './request-logging';

function createApp() {
  const records: Record<string, unknown>[] = [];

  const logger = createLogger(
    { level: 'info', pretty: false },
    {
      write(line) {
        records.push(JSON.parse(line));
      },
    },
  );

  const app = new Elysia()
    .use(createRequestLogging(logger, 'test'))
    .use(createErrorHandler(logger))
    .use(
      new Elysia().get('/nested', async () => {
        await Promise.resolve();
        return 'ok';
      }),
    )
    .get('/rejected', () => {
      throw new BadRequestError();
    })
    .get('/failed', () => {
      throw new Error('failure');
    })
    .get('/response', () => new Response('not found', { status: 404 }));

  return { app, records };
}

describe('request logging', () => {
  test('isolates concurrent request IDs and excludes query and credentials', async () => {
    const { app, records } = createApp();

    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        app.handle(
          new Request('http://localhost/nested?token=secret', {
            headers: { authorization: 'Bearer secret', cookie: 'session=secret' },
          }),
        ),
      ),
    );

    await new Promise(resolve => setTimeout(resolve, 0));
    const ids = responses.map(response => response.headers.get('x-request-id'));
    expect(new Set(ids).size).toBe(3);
    expect(ids.every(Boolean)).toBe(true);

    const completed = records.filter(record => record.event === 'http.request.completed');
    expect(completed).toHaveLength(3);
    expect(completed.map(record => record.requestId).sort()).toEqual(ids.sort());
    expect(completed.every(record => record.statusCode === 200)).toBe(true);
    expect(JSON.stringify(records)).not.toContain('secret');
  });

  test('correlates business and unexpected errors with response IDs', async () => {
    const { app, records } = createApp();

    for (const [path, status, event] of [
      ['/rejected', 400, 'http.business.failed'],
      ['/failed', 500, 'http.request.failed'],
    ] as const) {
      const response = await app.handle(new Request(`http://localhost${path}`));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(response.status).toBe(status);
      const failure = records.find(record => record.event === event);
      expect(failure?.requestId).toBe(response.headers.get('x-request-id'));
      expect(records.some(record => record.path === path && record.statusCode === status)).toBe(
        true,
      );
    }
  });

  test('records the actual status of a returned Response', async () => {
    const { app, records } = createApp();
    const response = await app.handle(new Request('http://localhost/response'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(response.status).toBe(404);
    expect(records.find(record => record.event === 'http.request.completed')?.statusCode).toBe(404);
  });
});
