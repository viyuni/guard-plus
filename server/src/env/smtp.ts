import { envEmails, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import type { SmtpMailConfig } from '#infrastructure/mail';

export const smtpEnvShape = {
  NOTIFY_EMAILS: v.optional(envEmails),
  SMTP_HOST: v.optional(v.string()),
  SMTP_PORT: v.optional(port()),
  SMTP_USER: v.optional(v.string()),
  SMTP_PASS: v.optional(v.string()),
  SMTP_FROM: v.optional(v.string()),
};

export const smtpEnv = createEnv({
  server: smtpEnvShape,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type SmtpEnv = typeof smtpEnv;

/**
 * 把 SMTP 环境变量映射成邮件基础设施需要的技术配置。
 *
 * SMTP 未完整配置时返回 undefined，由 App 组合根决定降级实现。
 */
export function toSmtpMailConfig(env: SmtpEnv): SmtpMailConfig | undefined {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    return undefined;
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM ?? env.SMTP_USER,
    notifyEmails: env.NOTIFY_EMAILS ?? [],
  };
}
