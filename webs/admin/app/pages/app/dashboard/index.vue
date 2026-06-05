<script setup lang="ts">
import { VisAxis, VisGroupedBar, VisStackedBar, VisXYContainer } from '@unovis/vue';
import { Card, CardContent, CardHeader, CardTitle } from '@web/ui/components/ui/card';
import type { ChartConfig } from '@web/ui/components/ui/chart';
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltipContent,
  componentToString,
} from '@web/ui/components/ui/chart';
import { AlertCircle, CalendarClock, Coins, PackageCheck, ShipWheel } from 'lucide-vue-next';

import { dashboardOverviewQuery } from '~/features/dashboard/queries';

definePageMeta({ title: 'Dashboard' });

const { data: overview } = useQuery(dashboardOverviewQuery({ months: 12 }));

const numberFormat = new Intl.NumberFormat('zh-CN');

const biliGuardTrendConfig = {
  zongdu: { label: '总督', color: 'var(--chart-1)' },
  tidu: { label: '提督', color: 'var(--chart-2)' },
  jianzhang: { label: '舰长', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const orderTrendConfig = {
  count: { label: '订单', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const statusLabels: Record<string, string> = {
  failed: '失败',
  ignored: '已忽略',
  processing: '处理中',
  succeeded: '成功',
};

const summaryCards = computed(() => [
  {
    label: '本月大航海',
    value: overview.value?.summary.currentMonthBiliGuardEvents ?? 0,
    icon: ShipWheel,
  },
  {
    label: '本月订单',
    value: overview.value?.summary.currentMonthOrders ?? 0,
    icon: PackageCheck,
  },
  {
    label: '待处理订单',
    value: overview.value?.summary.pendingOrders ?? 0,
    icon: CalendarClock,
  },
  {
    label: '本月发放积分',
    value: overview.value?.summary.currentMonthGrantedPoints ?? 0,
    icon: Coins,
  },
  {
    label: '未绑定事件',
    value: overview.value?.summary.unboundBiliGuardEvents ?? 0,
    icon: AlertCircle,
  },
]);

const biliGuardTrend = computed(() => overview.value?.trends.biliGuardEvents ?? []);
const orderTrend = computed(() => overview.value?.trends.orders ?? []);
const biliGuardStatusStats = computed(() => overview.value?.biliGuardStatusStats ?? []);
const recentOrders = computed(() => overview.value?.recentOrders ?? []);
const recentFailedBiliGuardEvents = computed(
  () => overview.value?.recentFailedBiliGuardEvents ?? [],
);

type BiliGuardTrendItem = (typeof biliGuardTrend.value)[number];
type OrderTrendItem = (typeof orderTrend.value)[number];

function getTrendMonth(item: BiliGuardTrendItem | OrderTrendItem) {
  return item.month;
}

function getZongduCount(item: BiliGuardTrendItem) {
  return item.zongdu;
}

function getTiduCount(item: BiliGuardTrendItem) {
  return item.tidu;
}

function getJianzhangCount(item: BiliGuardTrendItem) {
  return item.jianzhang;
}

function getOrderCount(item: OrderTrendItem) {
  return item.count;
}

function formatNumber(value: number | string | null | undefined) {
  return numberFormat.format(Number(value ?? 0));
}

function formatStatus(status: string) {
  return statusLabels[status] ?? status;
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Card v-for="card in summaryCards" :key="card.label">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-muted-foreground text-sm font-medium">{{ card.label }}</CardTitle>
          <component :is="card.icon" class="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div class="font-mono text-2xl font-semibold tabular-nums">
            {{ formatNumber(card.value) }}
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>大航海趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer :config="biliGuardTrendConfig" class="h-72 w-full">
            <VisXYContainer :data="biliGuardTrend">
              <VisStackedBar
                :x="getTrendMonth"
                :y="[getZongduCount, getTiduCount, getJianzhangCount]"
                :color="['var(--color-zongdu)', 'var(--color-tidu)', 'var(--color-jianzhang)']"
              />
              <VisAxis type="x" />
              <VisAxis type="y" />
              <ChartCrosshair
                :template="componentToString(biliGuardTrendConfig, ChartTooltipContent)"
              />
            </VisXYContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>订单趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer :config="orderTrendConfig" class="h-72 w-full">
            <VisXYContainer :data="orderTrend">
              <VisGroupedBar :x="getTrendMonth" :y="getOrderCount" color="var(--color-count)" />
              <VisAxis type="x" />
              <VisAxis type="y" />
              <ChartCrosshair
                :template="componentToString(orderTrendConfig, ChartTooltipContent)"
              />
            </VisXYContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>事件状态</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="item in biliGuardStatusStats"
            :key="item.status"
            class="flex items-center justify-between gap-3"
          >
            <div class="text-sm">{{ formatStatus(item.status) }}</div>
            <div class="font-mono text-sm font-medium tabular-nums">
              {{ formatNumber(item.count) }}
            </div>
          </div>
          <div v-if="!biliGuardStatusStats.length" class="text-muted-foreground text-sm">
            暂无数据
          </div>
        </CardContent>
      </Card>

      <Card class="xl:col-span-2">
        <CardHeader>
          <CardTitle>最近订单</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto]"
          >
            <div class="min-w-0">
              <div class="truncate text-sm font-medium">{{ order.productName }}</div>
              <div class="text-muted-foreground truncate text-xs">
                {{ order.username ?? '-' }} / {{ order.biliUid ?? '-' }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono text-sm tabular-nums">
                {{ formatNumber(order.price) }} {{ order.pointTypeName }}
              </div>
              <Badge variant="outline" class="mt-1">{{ order.status }}</Badge>
            </div>
          </div>
          <div v-if="!recentOrders.length" class="text-muted-foreground text-sm">暂无订单</div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>最近失败事件</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div
          v-for="event in recentFailedBiliGuardEvents"
          :key="event.id"
          class="grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[180px_1fr_auto]"
        >
          <div class="font-mono text-sm tabular-nums">{{ event.biliEventId }}</div>
          <div class="min-w-0">
            <div class="truncate text-sm">
              {{ event.lastErrorCode ? `${event.lastErrorCode}: ` : ''
              }}{{ event.lastErrorMessage }}
            </div>
            <div class="text-muted-foreground text-xs">UID {{ event.biliUid }}</div>
          </div>
          <div class="text-muted-foreground text-right text-xs">
            {{ event.occurredAt?.toLocaleString() ?? '-' }}
          </div>
        </div>
        <div v-if="!recentFailedBiliGuardEvents.length" class="text-muted-foreground text-sm">
          暂无失败事件
        </div>
      </CardContent>
    </Card>
  </div>
</template>
