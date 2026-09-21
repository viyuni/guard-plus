import { envEmails, port } from '@shared/schema';
import * as v from 'valibot';

/** SMTP 环境变量 Schema 片段。 */
export const smtpEnv = {
  NOTIFY_EMAILS: v.optional(envEmails),
  SMTP_HOST: v.optional(v.string()),
  SMTP_PORT: v.optional(port()),
  SMTP_USER: v.optional(v.string()),
  SMTP_PASS: v.optional(v.string()),
  SMTP_FROM: v.optional(v.string()),
};
