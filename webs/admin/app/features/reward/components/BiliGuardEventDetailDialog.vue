<script setup lang="ts">
import type { BiliGuardEvent } from './BiliGuardEventListView.vue';

interface LegacyBiliGuardEventSnapshot {
  uname: string;
  guardName: string;
  totalNormalized: number;
  isYearGuard: boolean;
  isManual?: boolean;
  roomId: number;
  priceNormalized: number;
}

interface NormalizedBiliGuardEventSnapshot {
  user: {
    username: string;
  };
  guardName: string;
  quantityNormalized: number;
  isYear: boolean;
  roomId: number;
  price: number;
}

interface BiliGuardEventEnvelopeSnapshot {
  schemaVersion: number;
  source: {
    provider: 'bevent' | 'laplace' | 'manual';
    channel: string;
  };
  event: NormalizedBiliGuardEventSnapshot;
  raw: unknown;
}

const props = defineProps<{
  event: BiliGuardEvent;
}>();

const open = defineModel<boolean>('open', { default: false });

const eventEnvelope = computed(() => {
  const snapshot = props.event.eventSnapshot as
    | BiliGuardEventEnvelopeSnapshot
    | LegacyBiliGuardEventSnapshot;

  return 'schemaVersion' in snapshot ? snapshot : null;
});

const snapshot = computed<NormalizedBiliGuardEventSnapshot>(() => {
  if (eventEnvelope.value) return eventEnvelope.value.event;

  const legacy = props.event.eventSnapshot as LegacyBiliGuardEventSnapshot;
  return {
    user: {
      username: legacy.uname,
    },
    guardName: legacy.guardName,
    quantityNormalized: legacy.totalNormalized,
    isYear: legacy.isYearGuard,
    roomId: legacy.roomId,
    price: legacy.priceNormalized,
  };
});

const sourceLabel = computed(() => {
  const source = eventEnvelope.value?.source;
  if (!source) return '旧版实时事件';
  if (source.provider === 'manual') return '手动创建';
  if (source.provider === 'laplace') return `Laplace · ${source.channel}`;
  return `bevent · ${source.channel}`;
});

const rawEventJson = computed(() =>
  JSON.stringify(eventEnvelope.value?.raw ?? props.event.eventSnapshot, null, 2),
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>事件详情</DialogTitle>
        <DialogDescription class="pr-6 break-all">{{ event.biliEventId }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
          <div>
            <div class="text-muted-foreground text-xs">UID</div>
            <div>{{ event.biliUid }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">昵称</div>
            <div>{{ snapshot.user.username }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">B站用户昵称</div>
            <div>{{ event.user?.username ?? '未关联' }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">舰长类型</div>
            <div>{{ snapshot.guardName }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">直播间</div>
            <div>{{ snapshot.roomId }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">来源</div>
            <div>{{ sourceLabel }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">订单金额</div>
            <div>{{ snapshot.price }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">折算月数</div>
            <div>{{ snapshot.quantityNormalized }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">年度大航海</div>
            <div>{{ snapshot.isYear ? '是' : '否' }}</div>
          </div>
        </div>

        <div v-if="event.lastErrorMessage" class="text-destructive text-sm">
          {{ event.lastErrorCode ? `${event.lastErrorCode}: ` : '' }}{{ event.lastErrorMessage }}
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">预览奖励</div>
          <div v-if="event.rewardItemSnapshots.length" class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="rewardItem in event.rewardItemSnapshots"
              :key="`${event.biliEventId}-${rewardItem.ruleSnapshot.id}-${rewardItem.pointTypeId}`"
              class="rounded-md border p-3 text-sm"
            >
              <div class="font-medium">{{ rewardItem.pointTypeSnapshot.name }}</div>
              <div class="text-muted-foreground">
                {{ rewardItem.ruleSnapshot.name }} · {{ rewardItem.points }} 点
              </div>
            </div>
          </div>
          <div v-else class="text-muted-foreground text-sm">暂无匹配奖励</div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">发放结果</div>
          <div v-if="event.rewardResultSnapshots.length" class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="rewardResult in event.rewardResultSnapshots"
              :key="rewardResult.transactionId"
              class="rounded-md border p-3 text-sm"
            >
              <div class="font-medium">{{ rewardResult.points }} 点</div>
              <div class="text-muted-foreground break-all">
                交易 {{ rewardResult.transactionId }}
              </div>
              <Badge v-if="rewardResult.duplicated" class="mt-2" size="sm" variant="secondary">
                已幂等跳过
              </Badge>
            </div>
          </div>
          <div v-else class="text-muted-foreground text-sm">暂无发放记录</div>
        </div>

        <details class="rounded-md border p-3 text-sm">
          <summary class="cursor-pointer font-medium">原始事件</summary>
          <pre class="mt-3 max-h-80 overflow-auto text-xs break-all whitespace-pre-wrap">{{
            rawEventJson
          }}</pre>
        </details>
      </div>
    </DialogContent>
  </Dialog>
</template>
