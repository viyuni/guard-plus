import { Queue } from 'bunqueue/client';

export const NOTIFY_QUEUE_NAME = 'notify' as const;

export interface NewOrderEmailInput {
  orderNo: string;
  username: string;
  biliUid: string;
  productName: string;
  pointTypeName: string;
  price: number;
  deliveryType: string;
  status: string;
  createdAt: Date | string;
  userRemark?: string | null;
}

export const notifyQueue = new Queue<NewOrderEmailInput>(NOTIFY_QUEUE_NAME, {
  embedded: true,
});

export async function publishOrderCreated(input: NewOrderEmailInput) {
  await notifyQueue.add(NOTIFY_QUEUE_NAME, input, {
    attempts: 2,
    backoff: 1000,
    durable: true,
  });
}
