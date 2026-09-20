import { envEmails, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import { token } from 'cyrenejs';
import * as v from 'valibot';

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
 * 归一化后的 SMTP 配置。
 *
 * SMTP 未配置时整体为 undefined，由消费方决定降级行为。
 */
export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  notifyEmails: string[];
}

/** 邮件模块需要的 SMTP 配置 */
export const SmtpConfig = token<SmtpConfig | undefined>('SmtpConfig');

export function toSmtpConfig(env: SmtpEnv): SmtpConfig | undefined {
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
