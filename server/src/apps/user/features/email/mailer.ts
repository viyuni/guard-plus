import { ripple } from 'cyrenex';

import { createMailer, type SmtpMailConfig } from '#infrastructure/mail';

/**
 * User App 的邮件发送能力。
 *
 * SMTP 配置由 App Boundary 提供; 未配置时得到一个明确的降级实现,
 * 因此依赖图里不存在 `Mailer | undefined`。
 *
 * 配置是环境变量而不是依赖, 所以这里用工厂函数把配置闭包进一条 ripple,
 * 由组合根 `override(Mailer, createUserMailer(config.mail))` 装配。
 */
export function createUserMailer(config: SmtpMailConfig | undefined) {
  return ripple('Mailer', () => createMailer(config));
}
