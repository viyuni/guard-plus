import { ripple } from 'cyrenejs';

import { createMailer, type SmtpMailConfig } from '#infrastructure/mail';

/**
 * User App 的邮件发送能力。
 *
 * SMTP 配置由 App Boundary 提供; 未配置时得到一个明确的降级实现,
 * 因此依赖图里不存在 `Mailer | undefined`。
 */
export const UserMailer = ripple(
  {},
  (_deps, config: SmtpMailConfig | undefined) => createMailer(config),
  {
    debugName: 'UserMailer',
    dispose: mailer => mailer.close(),
  },
);
