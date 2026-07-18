import type { BiliRegisterUseCase } from '#modules/auth';
import type { BiliEventEnvelope, BiliGuardEventEnvelope } from '#modules/bili-event';
import { isEventMonitorMessage, receiveEventMonitorMessage } from '#modules/event';
import { publishBilibiliGuardEvent } from '#queues';
import { redis } from '#redis';
import { logger } from '#utils/logger';

export interface BiliEventDispatcherDeps {
  biliRegisterUseCase: BiliRegisterUseCase;
}

export function createBiliEventDispatcher({ biliRegisterUseCase }: BiliEventDispatcherDeps) {
  return async (envelope: BiliEventEnvelope) => {
    const event = envelope.event;

    switch (event.type) {
      case 'guard': {
        await publishBilibiliGuardEvent(envelope as BiliGuardEventEnvelope);
        logger.info(
          {
            source: envelope.source,
            event,
          },
          'Bilibili Guard Message',
        );
        break;
      }
      case 'message': {
        if (isEventMonitorMessage(event.content)) {
          await receiveEventMonitorMessage(redis, event.content);
          break;
        }

        await biliRegisterUseCase.matchMessage({
          code: event.content,
          biliUid: event.user.biliUid,
          biliName: event.user.username,
        });
        break;
      }
    }
  };
}
