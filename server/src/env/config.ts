import { token } from 'cyrenejs';

import type { SharedEnv } from './shared';
import type { SmtpConfig } from './smtp';

export type NodeEnv = SharedEnv['NODE_ENV'];

/**
 * 归一化后的 app 运行时配置。
 *
 * app 的 `env.ts` 把带前缀的 env 显式映射成这份结构（例如
 * `ADMIN_JWT_SECRET -> jwtSecret`），`createContainer` 再逐项绑定成配置令牌。
 * 这样共享模块与 app provider 都只依赖令牌，不需要知道 env 的前缀。
 */
export interface AppConfig {
  nodeEnv: NodeEnv;
  dataSecret: string;
  jwtSecret: string;
  biliRoom: number;
  registerCodeTtlSeconds: number;
  imageSavePath: string;
  apiOrigin: string;
  webOrigins: string[];
  smtp?: SmtpConfig;
}

/** 事件进程只需要事件链路用到的配置。 */
export interface EventConfig {
  nodeEnv: NodeEnv;
  dataSecret: string;
  biliRoom: number;
  registerCodeTtlSeconds: number;
}

/** app 级配置令牌 */
export const JwtSecret = token<string>('JwtSecret');
export const ApiOrigin = token<string>('ApiOrigin');
export const WebOrigins = token<string[]>('WebOrigins');
