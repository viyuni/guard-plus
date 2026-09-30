import { expect, test } from 'bun:test';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createConfiguredLogger } from './index';

async function waitForRotation(directory: string, number: number) {
  const deadline = Date.now() + 3_000;

  while (Date.now() < deadline) {
    const files = (await readdir(directory)).filter(file => file.startsWith('app.'));

    if (files.some(file => file.endsWith(`.${number}.log`)) && files.length <= 2) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 20));
  }

  return false;
}

test('flushes persistent JSON logs on shutdown and preserves them across logger recreation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'guard-plus-logs-'));

  try {
    for (const attempt of [1, 2]) {
      const logger = createConfiguredLogger({ level: 'debug', pretty: false, directory });

      try {
        logger.debug({ event: 'test.persisted', attempt, password: 'secret' }, '持久化测试');
      } finally {
        await logger[Symbol.asyncDispose]?.();
      }
    }

    const files = (await readdir(directory)).filter(file => file.endsWith('.log'));

    const lines = (
      await Promise.all(files.map(file => readFile(join(directory, file), 'utf8')))
    ).join('');

    const records = lines
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));

    expect(records.map(record => record.attempt)).toEqual([1, 2]);
    expect(records.every(record => record.password === '[REDACTED]')).toBe(true);
    expect(lines).not.toContain('secret');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rotates by size and limits files from previous logger instances', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'guard-plus-rotation-'));

  try {
    await writeFile(join(directory, 'unrelated.log'), 'preserve');

    for (const attempt of [1, 2, 3]) {
      const logger = createConfiguredLogger({
        level: 'info',
        pretty: false,
        directory,
        maxSizeMb: 0.00001,
        maxFiles: 2,
      });

      try {
        logger.info({ event: 'test.rotated', attempt }, '轮转测试');
        expect(await waitForRotation(directory, attempt + 1)).toBe(true);
      } finally {
        await logger[Symbol.asyncDispose]?.();
      }
    }

    const files = (await readdir(directory)).filter(file => file.startsWith('app.'));

    const lines = (
      await Promise.all(files.map(file => readFile(join(directory, file), 'utf8')))
    ).join('');

    expect(files).toHaveLength(2);
    expect(lines).toContain('"attempt":3');
    expect(lines).not.toContain('"attempt":1');
    expect(await readFile(join(directory, 'unrelated.log'), 'utf8')).toBe('preserve');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
