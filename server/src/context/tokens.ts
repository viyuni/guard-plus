import { token } from 'cyrenejs';

import type { DbClient } from '#db';
import type { ImageUseCase } from '#modules/image/usecase';
import type { RedisClient } from '#redis';

export const Database = token<DbClient>('Database');
export const Redis = token<RedisClient>('Redis');
export const DataSecret = token<string>('DataSecret');
export const BiliRoom = token<number | undefined>('BiliRoom');
export const RegisterCodeTtl = token<number>('RegisterCodeTtl');
export const JwtSecret = token<string>('JwtSecret');
export const ImageSavePath = token<string>('ImageSavePath');

// Event 和 seed 不需要图片能力，由各入口显式绑定 undefined。
export const PointImageUseCase = token<ImageUseCase | undefined>('PointImageUseCase');
export const RewardLogger = token<
  | {
      warn: (payload: Record<string, unknown>, message?: string) => void;
    }
  | undefined
>('RewardLogger');
