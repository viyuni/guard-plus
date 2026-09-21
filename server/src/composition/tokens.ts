import { token } from 'cyrenejs';

import type { DbClient } from '#infrastructure/db';
import type { AppLogger } from '#infrastructure/logger';
import type { Mailer as MailerService } from '#infrastructure/mail';
import type { RedisClient } from '#infrastructure/redis';
import type { ImageStorage as ImageStorageService } from '#infrastructure/storage';

/**
 * 组合层令牌。
 *
 * 令牌只表达"能力", 不表达实现: 基础设施与配置都在 App Composition Root
 * 绑定具体值。模块与 HTTP adapter 只依赖令牌, 因此既不读环境变量,
 * 也不直接引用具体实现。
 */

/** 数据库客户端 */
export const Database = token<DbClient>('Database');

/** Redis 客户端 */
export const Redis = token<RedisClient>('Redis');

/** 应用日志器 */
export const Logger = token<AppLogger>('Logger');

/** 邮件发送能力 */
export const Mailer = token<MailerService>('Mailer');

/** 图片存储能力 */
export const ImageStorage = token<ImageStorageService>('ImageStorage');

/** 图片存储目录, 供本地图片存储实现使用 */
export const ImageSavePath = token<string>('ImageSavePath');

/** 数据加密密钥 */
export const DataSecret = token<string>('DataSecret');

/** JWT 签名密钥 */
export const JwtSecret = token<string>('JwtSecret');

/** 当前 App 对外暴露的 API Origin */
export const ApiOrigin = token<string>('ApiOrigin');

/** 当前 App 允许的 Web Origin */
export const WebOrigins = token<string[]>('WebOrigins');

/** B 站直播间 ID */
export const BiliRoom = token<number>('BiliRoom');

/** B 站注册码有效期（秒） */
export const RegisterCodeTtl = token<number>('RegisterCodeTtl');
