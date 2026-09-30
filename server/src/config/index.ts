import path from 'node:path';

import { createEnv } from '@t3-oss/env-core';
import { InvalidDependencyError, ripple } from 'cyrenex';
import * as v from 'valibot';

import { biliEnv } from './bili';
import { databaseEnv } from './database';
import { imageEnv } from './image';
import { redisEnv } from './redis';
import { type NodeEnv, sharedEnv } from './shared';
import { smtpEnv } from './smtp';

const defaultImageSavePath = path.join(process.cwd(), 'public', 'images');

export type { NodeEnv };

/**
 * 共享配置。
 *
 * 三个 App 进程各自只拿到自己那份环境变量, 所以这里声明的是跨 App 共享的配置;
 * App 专属变量留在各 App 的 config.ts。
 *
 * 基础设施能力由这些配置逐级派生, 生命周期归容器所有。
 */
export const configEnv = createEnv({
  server: {
    ...sharedEnv,
    ...databaseEnv,
    ...biliEnv,
    ...imageEnv,
    ...redisEnv,
    ...smtpEnv,

    ADMIN_JWT_SECRET: v.optional(v.string()),
    USER_JWT_SECRET: v.optional(v.string()),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

/** 配置源头: 环境变量解析结果就是一条 ripple, 其余配置项都从它派生。 */
export const Config = ripple('Config', () => configEnv);

/** 数据加密密钥 */
export const DataSecret = ripple(
  'DataSecret',
  {
    Config,
  },
  ({ Config }) => Config.DATA_SECRET,
);

/** 管理端 JWT 签名密钥 */
export const AdminJwtSecret = ripple(
  'AdminJwtSecret',
  {
    Config,
  },
  ({ Config }) => Config.ADMIN_JWT_SECRET ?? raiseMissing('ADMIN_JWT_SECRET'),
);

/** 用户端 JWT 签名密钥 */
export const UserJwtSecret = ripple(
  'UserJwtSecret',
  {
    Config,
  },
  ({ Config }) => Config.USER_JWT_SECRET ?? raiseMissing('USER_JWT_SECRET'),
);

function raiseMissing(name: string): never {
  throw new InvalidDependencyError(`缺少 ${name}`);
}

/** B 站直播间 ID */
export const BiliRoom = ripple(
  'BiliRoom',
  {
    Config,
  },
  ({ Config }) => Config.BILI_ROOM,
);

/** B 站注册码有效期（秒） */
export const RegisterCodeTtl = ripple(
  'RegisterCodeTtl',
  {
    Config,
  },
  ({ Config }) => Config.BILI_REGISTER_CODE_TTL_SECONDS,
);

/** 图片存储目录: 环境变量未配置时落到 server/public/images */
export const imageSavePath = configEnv.IMAGE_SAVE_PATH ?? defaultImageSavePath;

/** 图片存储目录, 供本地图片存储实现使用 */
export const ImageSavePath = ripple('ImageSavePath', () => imageSavePath);

/** 数据库连接串 */
export const DatabaseUrl = ripple(
  'DatabaseUrl',
  {
    Config,
  },
  ({ Config }) => Config.DATABASE_URL,
);

/** Redis 连接参数 */
export const RedisOptions = ripple(
  'RedisOptions',
  {
    Config,
  },
  ({ Config }) => ({
    url: Config.REDIS_URL,
    password: Config.REDIS_PASSWORD,
    connectionTimeoutMs: Config.REDIS_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: Config.REDIS_IDLE_TIMEOUT_MS,
    maxRetries: Config.REDIS_MAX_RETRIES,
  }),
);

/** 日志器参数 */
export const LoggerConfig = ripple(
  'LoggerConfig',
  {
    Config,
  },
  ({ Config }) => ({
    level: Config.LOG_LEVEL,
    pretty: Config.NODE_ENV === 'development',
    directory: Config.LOG_DIRECTORY,
    maxSizeMb: Config.LOG_MAX_SIZE_MB,
    maxFiles: Config.LOG_MAX_FILES,
  }),
);

/** SMTP 配置: 未配置完整时为 undefined, 由 Mailer 选择降级实现 */
export const SmtpConfig = ripple(
  'SmtpConfig',
  {
    Config,
  },
  ({ Config }) => {
    if (!Config.SMTP_HOST || !Config.SMTP_PORT || !Config.SMTP_USER || !Config.SMTP_PASS) {
      return undefined;
    }

    return {
      host: Config.SMTP_HOST,
      port: Config.SMTP_PORT,
      user: Config.SMTP_USER,
      pass: Config.SMTP_PASS,
      from: Config.SMTP_FROM ?? Config.SMTP_USER,
      notifyEmails: Config.NOTIFY_EMAILS ?? [],
    };
  },
);
