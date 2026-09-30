import { ripple } from 'cyrenex';

import type { DbClient } from '#infrastructure/db';
import type { AppLogger } from '#infrastructure/logger';
import type { RedisClient } from '#infrastructure/redis';

/**
 * 组合层绑定。
 *
 * 配置与环境变量在这里全部变成 ripple: Composition Root 只构造自己依赖图
 * 真正需要的那些, 再用 `override(令牌, 绑定)` 把令牌指向具体实现。
 *
 * 绑定声明的 key 与令牌同名 —— 一个令牌对应图上同一个节点, 诊断图里看到的
 * 就是这张图真实装配出来的东西。
 *
 * 能力实现（图片存储、邮件）本身就是 ripple, 组合根直接 override, 不在这里
 * 再包一层壳。
 *
 * 不提供 `createBaseBindings` 之类的分组 API —— 分组会把不同 App 的绑定需求
 * 耦合在一起, 也让"到底绑了哪些令牌"变得不可见。
 */

// --- 基础设施实例（外部持有: borrowed, 容器不接管清理） ---

export function databaseBinding(db: DbClient) {
  return ripple('Database', () => db, { ownership: 'borrowed' });
}

export function redisBinding(redis: RedisClient) {
  return ripple('Redis', () => redis, { ownership: 'borrowed' });
}

export function loggerBinding(logger: AppLogger) {
  return ripple('Logger', () => logger, { ownership: 'borrowed' });
}

// --- 配置值 ---

export function dataSecretBinding(secret: string) {
  return ripple('DataSecret', () => secret, { ownership: 'borrowed' });
}

export function jwtSecretBinding(secret: string) {
  return ripple('JwtSecret', () => secret, { ownership: 'borrowed' });
}

export function apiOriginBinding(origin: string) {
  return ripple('ApiOrigin', () => origin, { ownership: 'borrowed' });
}

export function webOriginsBinding(origins: string[]) {
  return ripple('WebOrigins', () => origins, { ownership: 'borrowed' });
}

export function biliRoomBinding(room: number) {
  return ripple('BiliRoom', () => room, { ownership: 'borrowed' });
}

export function registerCodeTtlBinding(seconds: number) {
  return ripple('RegisterCodeTtl', () => seconds, { ownership: 'borrowed' });
}

export function imageSavePathBinding(savePath: string) {
  return ripple('ImageSavePath', () => savePath, { ownership: 'borrowed' });
}
