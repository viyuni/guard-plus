import { type InferInput, ripple } from 'cyrenejs';
import ejs from 'ejs';

import { SmtpConfig } from '#env/smtp';
import type { NewOrderEmailInput } from '#queues';
import { BadRequestError } from '#utils';

import { Mailer } from '../domain';
import newOrderTemplate from '../domain/new-order.template.ejs' with { type: 'text' };

function formatDateTime(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return String(input);
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(date);
}

function formatDeliveryType(input: string) {
  const names: Record<string, string> = {
    automatic: '自动发放',
    manual: '人工履约',
  };

  return names[input] ?? input;
}

function formatOrderStatus(input: string) {
  const names: Record<string, string> = {
    pending: '待完成',
    completed: '已完成',
    refunded: '已退款',
  };

  return names[input] ?? input;
}

export const EmailUseCase = ripple(
  {
    Mailer,
    SmtpConfig,
  },
  ({ Mailer, SmtpConfig }) => {
    // 通知收件人来自 SMTP 配置。
    const notifyEmails = SmtpConfig?.notifyEmails ?? [];

    function renderTemplate(template: string, data: Record<string, unknown>) {
      return ejs.render(template, data);
    }

    function renderNewOrderEmail(input: NewOrderEmailInput) {
      return renderTemplate(newOrderTemplate, {
        ...input,
        createdAt: formatDateTime(input.createdAt),
        deliveryType: formatDeliveryType(input.deliveryType),
        status: formatOrderStatus(input.status),
        userRemark: input.userRemark || '无',
      });
    }

    return {
      renderTemplate,

      renderNewOrderEmail,

      async sendNewOrderEmail(input: NewOrderEmailInput) {
        if (!notifyEmails?.length) {
          return {
            recipients: [],
          };
        }

        if (!Mailer) {
          throw new BadRequestError('SMTP 未配置，无法发送邮件');
        }

        const html = renderNewOrderEmail(input);

        await Mailer.send({
          to: notifyEmails,
          subject: `新订单通知：${input.productName}`,
          html,
        });

        return {
          recipients: notifyEmails,
        };
      },
    };
  },
  { debugName: 'EmailUseCase' },
);

export type EmailUseCase = InferInput<typeof EmailUseCase>;
