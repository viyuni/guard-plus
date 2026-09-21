import { type InferInput, ripple } from 'cyrenejs';
import ejs from 'ejs';

import { Mailer } from '#composition/tokens';
import type { NewOrderEmailInput } from '#infrastructure/queue';

import newOrderTemplate from '../new-order.template.ejs' with { type: 'text' };

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

/**
 * 订单通知邮件渲染与发送。
 *
 * 收件人来自组合根绑定的 Mailer; 未配置通知收件人时直接跳过发送。
 */
export const EmailUseCase = ripple(
  {
    Mailer,
  },
  ({ Mailer }) => {
    const notifyEmails = Mailer.notifyEmails;

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
        if (!notifyEmails.length) {
          return {
            recipients: [],
          };
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
