import pino from 'pino';
import pretty from 'pino-pretty';

export interface LoggerOptions {
  /** 日志等级，例如 `debug` / `info` / `warn` / `error`。 */
  level: string;
  /** 是否使用人类可读的彩色输出，仅在开发环境开启。 */
  pretty: boolean;
}

/**
 * 创建应用日志器。
 *
 * 日志等级与输出格式由 App Boundary 决定后显式传入，
 * 基础设施不读取环境变量。
 */
export function createLogger({ level, pretty: usePretty }: LoggerOptions) {
  const stream = usePretty
    ? pretty({
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      })
    : undefined;

  const logger = pino({ level }, stream);

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
