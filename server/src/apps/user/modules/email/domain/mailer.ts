import { ripple } from 'cyrenejs';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { SmtpConfig } from '#env/smtp';

export interface SendMailInput {
  to: string[];
  subject: string;
  html: string;
}

export class Mailer {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  close() {
    this.transporter.close();
  }

  send(input: SendMailInput) {
    return this.transporter.sendMail({
      from: this.config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}

export function createMailer(config: SmtpConfig | undefined) {
  return config ? new Mailer(config) : undefined;
}

/**
 * SMTP 未配置时 mailer 为 undefined, 由 UseCase 决定是否降级。
 */
export const mailer = ripple(
  {
    smtpConfig: SmtpConfig,
  },
  ({ smtpConfig }) => createMailer(smtpConfig),
  {
    debugName: 'Mailer',
    dispose: value => value?.close(),
  },
);
