import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { BadRequestError } from '#shared';

export interface SendMailInput {
  to: string[];
  subject: string;
  html: string;
}

/** SMTP 邮件发送能力。未配置 SMTP 时仍返回一个明确的降级实现。 */
export interface Mailer {
  /** 通知收件人列表, 为空表示不需要发送通知。 */
  notifyEmails: string[];
  send(input: SendMailInput): Promise<unknown>;
  close(): void;
}

/** SMTP 技术配置, 由 App Boundary 从环境变量映射而来。 */
export interface SmtpMailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  notifyEmails: string[];
}

class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpMailConfig) {
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

  get notifyEmails() {
    return this.config.notifyEmails;
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

/**
 * SMTP 未配置时的降级实现。
 *
 * 通知收件人为空, 调用方据此跳过通知; 若仍被要求发送, 则抛出明确的业务错误。
 */
class UnconfiguredMailer implements Mailer {
  notifyEmails: string[] = [];

  close() {}

  async send(): Promise<never> {
    throw new BadRequestError('SMTP 未配置，无法发送邮件');
  }
}

export function createMailer(config: SmtpMailConfig | undefined) {
  return config ? new SmtpMailer(config) : new UnconfiguredMailer();
}
