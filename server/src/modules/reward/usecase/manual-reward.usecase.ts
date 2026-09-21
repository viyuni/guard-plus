import { BiliGuardType, type CreateManualBiliGuardEventBody } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';

import { BiliRoom } from '#composition/tokens';

import type { BiliGuardRewardEvent } from '../domain';
import { RewardProcessor } from './reward-processor';

/**
 * 手动大航海事件时长表。
 *
 * 按开通价格区间映射对应的时长（分钟）。
 */
const MANUAL_BILI_GUARD_DURATION_TABLE: Array<{
  min: number;
  max?: number;
  duration: number;
}> = [
  { min: 0, max: 1, duration: 4 },
  { min: 1, max: 5, duration: 6 },
  { min: 5, max: 10, duration: 10 },
  { min: 10, max: 15, duration: 20 },
  { min: 15, max: 30, duration: 30 },
  { min: 30, max: 50, duration: 60 },
  { min: 50, max: 100, duration: 60 * 2 },
  { min: 100, max: 500, duration: 60 * 5 },
  { min: 500, max: 1000, duration: 60 * 30 },
  { min: 1000, max: 2000, duration: 60 * 60 },
  { min: 2000, max: 5000, duration: 60 * 60 * 2 },
  { min: 5000, max: 10000, duration: 60 * 60 * 3 },
  { min: 10000, max: 20000, duration: 60 * 60 * 4 },
  { min: 20000, duration: 60 * 60 * 5 },
];

function getManualBiliGuardDuration(price: number) {
  if (price <= 0) {
    return 30;
  }

  const entry = MANUAL_BILI_GUARD_DURATION_TABLE.find(
    item => price >= item.min && (item.max === undefined || price < item.max),
  );

  return entry?.duration ?? 30;
}

function getManualBiliGuardMeta(guardType: CreateManualBiliGuardEventBody['guardType']) {
  const metas = {
    [BiliGuardType.Zongdu]: {
      name: '总督',
      priceNormalized: 19_998,
      color: '#ff5c7c',
    },
    [BiliGuardType.Tidu]: {
      name: '提督',
      priceNormalized: 1_998,
      color: '#e17aff',
    },
    [BiliGuardType.Jianzhang]: {
      name: '舰长',
      priceNormalized: 198,
      color: '#00aeec',
    },
  } satisfies Record<
    CreateManualBiliGuardEventBody['guardType'],
    { name: string; priceNormalized: number; color: string }
  >;

  return metas[guardType];
}

/** 管理端手动补录大航海事件并按规则发放奖励。 */
export const ManualRewardUseCase = ripple(
  {
    BiliRoom,
    RewardProcessor,
  },
  ({ BiliRoom, RewardProcessor }) => {
    function buildManualBiliGuardEvent(
      input: CreateManualBiliGuardEventBody,
    ): BiliGuardRewardEvent {
      const openedAt = input.openedAt instanceof Date ? input.openedAt : new Date(input.openedAt);
      const sendTime = Math.floor(openedAt.getTime() / 1000);
      const guardStartTime = sendTime;
      const timestampNormalized = openedAt.getTime();
      const uid = Number(input.uid);
      const guard = getManualBiliGuardMeta(input.guardType);
      const uname = input.uname;
      const unit = input.total >= 12 && input.total % 12 === 0 ? '年' : '月';
      const displayTotal = unit === '年' ? input.total / 12 : input.total;
      const priceNormalized = guard.priceNormalized * input.total;
      const price = priceNormalized * 1000;

      const message =
        input.total === 1
          ? `${uname} 开通了${guard.name}`
          : `${uname} 开通了${guard.name}${displayTotal}${unit}`;

      const id = `${sendTime}:${guardStartTime}:${BiliRoom}:${input.uid}:${input.guardType}:${price}`;

      return {
        cmd: 'USER_TOAST_MSG_V2',
        type: 'guard',
        id,
        isManual: true,
        uid,
        uname,
        face: '',
        message,
        price,
        priceNormalized,
        duration: getManualBiliGuardDuration(priceNormalized),
        color: guard.color,
        guardType: input.guardType,
        total: input.total,
        totalNormalized: input.total,
        isYearGuard: input.total >= 12 && input.total % 12 === 0,
        unit,
        guardName: guard.name,
        guardTotalCount: 1,
        effectId: 0,
        timestamp: guardStartTime,
        timestampNormalized,
        eventListenerUid: 0,
        roomId: BiliRoom,
        read: false,
      };
    }

    return {
      create(input: CreateManualBiliGuardEventBody) {
        return RewardProcessor.rewardBiliGuard(buildManualBiliGuardEvent(input));
      },
    };
  },
  { debugName: 'ManualRewardUseCase' },
);

export type ManualRewardUseCase = InferInput<typeof ManualRewardUseCase>;
