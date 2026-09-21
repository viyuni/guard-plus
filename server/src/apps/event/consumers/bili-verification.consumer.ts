import { type InferInput, ripple } from 'cyrenejs';

import Auth from '#modules/auth';

export interface BiliMessageEvent {
  content: string;
  uid: number;
  uname: string;
}

/** 将实时弹幕匹配到 Redis 中的短生命周期验证码 Challenge。 */
export const BiliVerificationConsumer = ripple(
  {
    BiliVerificationMatcher: Auth.BiliVerificationMatcher,
  },
  ({ BiliVerificationMatcher }) => ({
    consume(event: BiliMessageEvent) {
      return BiliVerificationMatcher.matchMessage({
        content: event.content,
        biliUid: event.uid.toString(),
        biliName: event.uname,
      });
    },
  }),
  { debugName: 'BiliVerificationConsumer' },
);

export type BiliVerificationConsumer = InferInput<typeof BiliVerificationConsumer>;
