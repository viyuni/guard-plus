import { ripple } from 'cyrenejs';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { smtpEnv, type SmtpEnv } from '#env/smtp';

interface SmtpConfigOptions {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface SendMailInput {
  to: string[];
  subject: string;
  html: string;
}

export class Mailer {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfigOptions) {
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
      from: this.config.user,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}

export function createMailer(config: SmtpEnv) {
  if (!config.SMTP_HOST || !config.SMTP_PORT || !config.SMTP_USER || !config.SMTP_PASS) {
    return undefined;
  }

  return new Mailer({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  });
}

/**
 * SMTP 未配置时 mailer 为 undefined, 由 UseCase 决定是否降级。
 */
export const mailer = ripple({}, () => createMailer(smtpEnv), {
  debugName: 'Mailer',
  dispose: value => value?.close(),
});
