import type { Guard } from '@viyuni/bevent-relay/events';
import { type InferInput, ripple } from 'cyrenex';

import { Logger } from '#composition/tokens';
import BiliEvent from '#modules/bili-event';
import { getBiliGuardEventTime } from '#modules/reward';

/** 将外部大航海事件持久化为 PostgreSQL Inbox 任务。 */
export const BiliGuardConsumer = ripple(
  'BiliGuardConsumer',
  {
    BiliEventRepo: BiliEvent.BiliEventRepo,
    Logger,
  },
  ({ BiliEventRepo, Logger }) => ({
    async consume(event: Guard) {
      const persisted = await BiliEventRepo.enqueueBiliGuard({
        biliEventId: event.id,
        biliUid: String(event.uid),
        occurredAt: getBiliGuardEventTime(event),
        eventSnapshot: event,
      });

      if (persisted) {
        Logger.info({ biliEventId: event.id }, 'Bilibili guard event persisted');
      }

      return persisted;
    },
  }),
);

export type BiliGuardConsumer = InferInput<typeof BiliGuardConsumer>;
