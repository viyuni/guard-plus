import { envEmails, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const smtpEnvShape = {
  NOTIFY_EMAILS: v.optional(envEmails),
  SMTP_HOST: v.optional(v.string()),
  SMTP_PORT: v.optional(port()),
  SMTP_USER: v.optional(v.string()),
  SMTP_PASS: v.optional(v.string()),
};

export const smtpEnv = createEnv({
  server: smtpEnvShape,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type SmtpEnv = typeof smtpEnv;
