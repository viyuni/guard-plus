import { token } from 'cyrenejs';

import type { DbClient } from '#db';
import type { ImageUseCase } from '#modules/image/usecase';
import type { RedisClient } from '#redis';

/**
 * 基础设施与可选能力令牌。
 *
 * 配置令牌定义在各自的 `#env/*` 旁边，例如 `#env/shared` 的 `DataSecret`、
 * `#env/config` 的 `JwtSecret`，与它们校验的 env 放在一起。
 */
export const Database = token<DbClient>('Database');
export const Redis = token<RedisClient>('Redis');

// Event 和 seed 不需要图片能力，由各入口显式绑定 undefined。
export const PointImageUseCase = token<ImageUseCase | undefined>('PointImageUseCase');
export const RewardLogger = token<
  | {
      warn: (payload: Record<string, unknown>, message?: string) => void;
    }
  | undefined
>('RewardLogger');
