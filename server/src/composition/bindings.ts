import type { Resolvable } from 'cyrenejs';

import type { DbClient } from '#infrastructure/db';
import type { AppLogger } from '#infrastructure/logger';
import type { Mailer as MailerService } from '#infrastructure/mail';
import type { RedisClient } from '#infrastructure/redis';
import type { ImageStorage as ImageStorageService } from '#infrastructure/storage';

import {
  ApiOrigin,
  BiliRoom,
  Database,
  DataSecret,
  ImageSavePath,
  ImageStorage,
  JwtSecret,
  Logger,
  Mailer,
  Redis,
  RegisterCodeTtl,
  WebOrigins,
} from './tokens';

/**
 * 组合层绑定。
 *
 * 一个令牌一个工厂: Composition Root 只调用自己依赖图真正需要的那些,
 * 不存在"绑一组"的聚合函数, 因此组内增删令牌不会波及其他 App。
 *
 * 不提供 `createBaseBindings` 之类的分组 API —— 分组会把不同 App 的绑定需求
 * 耦合在一起, 也让"到底绑了哪些令牌"变得不可见。
 */

// --- 基础设施实例（borrowed value: 生命周期仍由创建它的 App Boundary 持有） ---

export function databaseBinding(db: DbClient) {
  return { token: Database, value: db } as const;
}

export function redisBinding(redis: RedisClient) {
  return { token: Redis, value: redis } as const;
}

export function loggerBinding(logger: AppLogger) {
  return { token: Logger, value: logger } as const;
}

// --- 配置值 ---

export function dataSecretBinding(secret: string) {
  return { token: DataSecret, value: secret } as const;
}

export function jwtSecretBinding(secret: string) {
  return { token: JwtSecret, value: secret } as const;
}

export function apiOriginBinding(origin: string) {
  return { token: ApiOrigin, value: origin } as const;
}

export function webOriginsBinding(origins: string[]) {
  return { token: WebOrigins, value: origins } as const;
}

export function biliRoomBinding(room: number) {
  return { token: BiliRoom, value: room } as const;
}

export function registerCodeTtlBinding(seconds: number) {
  return { token: RegisterCodeTtl, value: seconds } as const;
}

export function imageSavePathBinding(savePath: string) {
  return { token: ImageSavePath, value: savePath } as const;
}

// --- 由基础设施实现提供的令牌（实现由 App 选择, Cyrene 管理其生命周期） ---

export function imageStorageBinding(implementation: Resolvable<ImageStorageService>) {
  return { token: ImageStorage, dependency: implementation } as const;
}

export function mailerBinding(implementation: Resolvable<MailerService>) {
  return { token: Mailer, dependency: implementation } as const;
}
