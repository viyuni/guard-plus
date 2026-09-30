import { once } from 'node:events';
import { join } from 'node:path';

import { ripple } from 'cyrenex';
import pino from 'pino';
import type { DestinationStream } from 'pino';
import pretty from 'pino-pretty';

import { LoggerConfig } from '#config';

export interface LoggerOptions {
  /** 日志等级，例如 `debug` / `info` / `warn` / `error`。 */
  level: string;
  /** 是否使用人类可读的彩色输出，仅在开发环境开启。 */
  pretty: boolean;
  /** 设置后，同时写标准输出和轮转文件。每个进程使用独立目录。 */
  directory?: string;
  maxSizeMb?: number;
  maxFiles?: number;
}

/**
 * 创建应用日志器。
 *
 * 日志等级与输出格式由 App Boundary 决定后显式传入，
 * 基础设施不读取环境变量。
 */
export function createLogger(
  { level, pretty: usePretty }: LoggerOptions,
  destination?: DestinationStream,
) {
  const stream =
    destination ??
    (usePretty
      ? pretty({
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        })
      : undefined);

  const logger = pino(
    {
      level,
      serializers: {
        err(error: unknown) {
          if (!(error instanceof Error)) {
            return { type: typeof error, message: String(error) };
          }

          return {
            type: error.name,
            message: error.message,
            stack: error.stack,
            code: 'code' in error ? error.code : undefined,
          };
        },
      },
      redact: {
        paths: [
          'password',
          'accessToken',
          'refreshToken',
          'cookie',
          'authorization',
          'phone',
          'address',
          '*.password',
          '*.accessToken',
          '*.refreshToken',
          '*.cookie',
          '*.authorization',
          '*.phone',
          '*.address',
        ],
        censor: '[REDACTED]',
      },
    },
    stream,
  );

  function printUrls(server: Bun.Server<unknown> | null, docsEnabled: boolean) {
    if (!server) {
      return;
    }

    const host = server.hostname === '0.0.0.0' ? 'localhost' : server.hostname;
    const baseUrl = `http://${host}:${server.port}`;

    logger.info(`➜  Local:   ${baseUrl}/`);

    if (docsEnabled) {
      logger.info(`➜  Docs:    ${baseUrl}/openapi`);
    }
  }

  function scope(name: string) {
    return logger.child({ scope: name });
  }

  return Object.assign(logger, {
    printUrls,
    scope,
  });
}

export type AppLogger = ReturnType<typeof createLogger>;

export function createConfiguredLogger(
  options: LoggerOptions,
): AppLogger & Partial<AsyncDisposable> {
  if (!options.directory) {
    return createLogger(options);
  }

  const transport = pino.transport<Record<string, unknown>>({
    targets: [
      {
        target: options.pretty ? 'pino-pretty' : 'pino/file',
        level: options.level,
        options: options.pretty
          ? { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' }
          : { destination: 1 },
      },
      {
        target: 'pino-roll',
        level: options.level,
        options: {
          file: join(options.directory, 'app.log'),
          mkdir: true,
          size: `${options.maxSizeMb ?? 20}m`,
          frequency: 'daily',
          dateFormat: 'yyyy-MM-dd',
          limit: { count: (options.maxFiles ?? 10) - 1, removeOtherLogFiles: true },
        },
      },
    ],
  });

  const logger = createLogger(options, transport);
  let closePromise: Promise<void> | undefined;

  return Object.assign(logger, {
    [Symbol.asyncDispose]() {
      closePromise ??= (async () => {
        const closed = once(transport, 'close');
        transport.end();
        await closed;
      })();

      return closePromise;
    },
  });
}

/**
 * 应用日志器。参数来自 `#config` 的 `LoggerConfig`。
 */
export const Logger = ripple(
  'Logger',
  {
    LoggerConfig,
  },
  ({ LoggerConfig }): AppLogger => createConfiguredLogger(LoggerConfig),
);
