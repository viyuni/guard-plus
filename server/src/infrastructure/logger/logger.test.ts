import { expect, test } from 'bun:test';

import { createLogger } from './index';

test('redacts credentials and excludes arbitrary error properties from child logs', () => {
  const lines: string[] = [];

  const logger = createLogger(
    { level: 'info', pretty: false },
    {
      write(line) {
        lines.push(line);
      },
    },
  );

  const err = Object.assign(new Error('query failed'), {
    code: '23505',
    query: 'insert sensitive data',
    parameters: ['secret'],
    request: { password: 'secret' },
  });

  logger
    .scope('test')
    .error({ err, password: 'secret', auth: { accessToken: 'secret' } }, '处理失败');
  const record = JSON.parse(lines[0]!);

  expect(record.err.message).toBe('query failed');
  expect(record.err.code).toBe('23505');
  expect(record.err.stack).toContain('query failed');
  expect(record.password).toBe('[REDACTED]');
  expect(record.auth.accessToken).toBe('[REDACTED]');
  expect(lines[0]).not.toContain('secret');
  expect(lines[0]).not.toContain('insert sensitive data');
});
