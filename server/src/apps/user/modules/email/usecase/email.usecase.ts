import ejs from 'ejs';

import type { NewOrderEmailInput } from '#queues';
import { BadRequestError } from '#utils';

import { Mailer } from '../domain';
import newOrderTemplate from '../domain/new-order.template.ejs' with { type: 'text' };

export interface EmailUseCaseDeps {
  mailer?: Mailer;
  notifyEmails?: string[];
}

export class EmailUseCase {
  constructor(private readonly deps: EmailUseCaseDeps) {}

  renderTemplate(template: string, data: Record<string, unknown>) {
    return ejs.render(template, data);
  }

  async renderNewOrderEmail(input: NewOrderEmailInput) {
    return this.renderTemplate(newOrderTemplate, {
      ...input,
      createdAt: this.formatDateTime(input.createdAt),
      deliveryType: this.formatDeliveryType(input.deliveryType),
      status: this.formatOrderStatus(input.status),
      userRemark: input.userRemark || '无',
    });
  }

  async sendNewOrderEmail(input: NewOrderEmailInput) {
    if (!this.deps.notifyEmails?.length) {
      return {
        recipients: [],
      };
    }

    if (!this.deps.mailer) {
      throw new BadRequestError('SMTP 未配置，无法发送邮件');
    }

    const html = await this.renderNewOrderEmail(input);

    await this.deps.mailer.send({
      to: this.deps.notifyEmails,
      subject: `新订单通知：${input.productName}`,
      html,
    });

    return {
      recipients: this.deps.notifyEmails,
    };
  }

  private formatDateTime(input: Date | string) {
    const date = input instanceof Date ? input : new Date(input);

    if (Number.isNaN(date.getTime())) return String(input);

    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false,
    }).format(date);
  }

  private formatDeliveryType(input: string) {
    const names: Record<string, string> = {
      automatic: '自动发放',
      manual: '人工履约',
    };

    return names[input] ?? input;
  }

  private formatOrderStatus(input: string) {
    const names: Record<string, string> = {
      pending: '待完成',
      completed: '已完成',
      refunded: '已退款',
    };

    return names[input] ?? input;
  }
}
