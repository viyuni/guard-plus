import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { SmtpEnv } from '#env/smtp';

export interface SmtpConfig {
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
