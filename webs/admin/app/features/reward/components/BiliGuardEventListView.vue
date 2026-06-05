<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { BiliEventPageQuery } from '@shared/schema/reward';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { DataTable } from '@web/ui/components/ui/table';
import { Eye, MoreHorizontal, Plus, RotateCcw } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useReplayBiliGuardReward } from '../mutations';
import { biliGuardEventPageQuery } from '../queries';
import BiliGuardManualCreateDialog from './BiliGuardManualCreateDialog.vue';

export type BiliGuardEventListPage = Treaty.Data<AdminApi['rewards']['biliGuard']['get']>;
export type BiliGuardEvent = NonNullable<BiliGuardEventListPage>['items'][number];

interface BiliGuardEventSnapshot {
  id: string;
  uid: number;
  uname: string;
  guardType: number;
  guardName: string;
  total: number;
  totalNormalized: number;
  isYearGuard: boolean;
  isManual?: boolean;
  roomId: number;
  timestamp: number;
  priceNormalized: number;
}
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'biliEventId', header: '事件 ID' },
  { accessorKey: 'biliUid', header: 'UID' },
  { accessorKey: 'user.username', header: '用户' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'retryCount', header: '重试次数' },
  { accessorKey: 'occurredAt', header: '发生时间' },
  { accessorKey: 'processedAt', header: '处理时间' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<BiliGuardEvent>[];

const {
  stateRefs: { page, pageSize, keyword, status },
  query,
} = useDebouncedPageQuery<BiliEventPageQuery>({
  status: undefined,
  startAt: undefined,
  endAt: undefined,
});

const { items: events, meta } = usePageQuery(() => biliGuardEventPageQuery(query.value));
const { mutate: replayBiliGuardReward, isLoading: isReplaying } = useReplayBiliGuardReward();
const manualCreateDialogOpen = ref(false);

const statusLabel: Record<string, string> = {
  processing: '处理中',
  succeeded: '成功',
  failed: '失败',
  ignored: '已忽略',
};

function canReplay(event: BiliGuardEvent) {
  if (!event.user) {
    return false;
  }

  if (event.status === 'failed' || event.status === 'ignored') {
    return true;
  }

  return false;
}

function getEventSnapshot(event: BiliGuardEvent) {
  return event.eventSnapshot as BiliGuardEventSnapshot;
}

function formatDateTime(value: Date | string | number | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="events"
    :columns="columns"
    :total="meta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full items-center justify-between gap-2">
        <div class="flex w-full flex-wrap items-center gap-2">
          <Input
            class="max-w-xs"
            placeholder="搜索事件 ID / UID"
            v-model:model-value.trim="keyword"
          />
          <NativeSelect v-model:model-value="status">
            <NativeSelectOption value="">事件状态</NativeSelectOption>
            <NativeSelectOption value="processing">处理中</NativeSelectOption>
            <NativeSelectOption value="succeeded">成功</NativeSelectOption>
            <NativeSelectOption value="failed">失败</NativeSelectOption>
            <NativeSelectOption value="ignored">已忽略</NativeSelectOption>
          </NativeSelect>
        </div>

        <Button type="button" @click="manualCreateDialogOpen = true">
          <Plus />
          手动创建
        </Button>
      </div>
    </template>

    <template #status="{ value }">
      <Badge
        size="sm"
        :variant="
          value === 'failed' ? 'destructive' : value === 'succeeded' ? 'outline' : 'secondary'
        "
      >
        {{ statusLabel[value] ?? value }}
      </Badge>
    </template>

    <template #occurredAt="{ value }">
      {{ formatDateTime(value) }}
    </template>

    <template #processedAt="{ value }">
      {{ formatDateTime(value) }}
    </template>

    <template #actions="{ row, rowData }">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="h-8 w-8 p-0">
            <span class="sr-only">打开菜单</span>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-50">
          <DropdownMenuLabel>操作</DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem @click="row.toggleExpanded()">
            <Eye />
            {{ row.getIsExpanded() ? '收起详情' : '查看详情' }}
          </DropdownMenuItem>

          <DropdownMenuItem
            :disabled="isReplaying || !canReplay(rowData)"
            @click="replayBiliGuardReward(rowData.biliEventId)"
          >
            <RotateCcw />
            回放奖励
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>

    <template #expanded="{ rowData }">
      <div class="space-y-4 py-2">
        <div class="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div class="text-muted-foreground">舰长类型</div>
            <div>{{ getEventSnapshot(rowData).guardName }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">直播间</div>
            <div>{{ getEventSnapshot(rowData).roomId }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">用户昵称</div>
            <div>{{ getEventSnapshot(rowData).uname }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">来源</div>
            <div>{{ getEventSnapshot(rowData).isManual ? '手动创建' : '实时事件' }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">订单金额</div>
            <div>{{ getEventSnapshot(rowData).priceNormalized }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">折算月数</div>
            <div>{{ getEventSnapshot(rowData).totalNormalized }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">年度大航海</div>
            <div>{{ getEventSnapshot(rowData).isYearGuard ? '是' : '否' }}</div>
          </div>
        </div>

        <div v-if="rowData.lastErrorMessage" class="text-destructive text-sm">
          {{ rowData.lastErrorCode ? `${rowData.lastErrorCode}: ` : ''
          }}{{ rowData.lastErrorMessage }}
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">预览奖励</div>
          <div v-if="rowData.rewardItemSnapshots.length" class="grid gap-2 md:grid-cols-2">
            <div
              v-for="rewardItem in rowData.rewardItemSnapshots"
              :key="`${rowData.biliEventId}-${rewardItem.ruleSnapshot.id}-${rewardItem.pointTypeId}`"
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
          <div v-if="rowData.rewardResultSnapshots.length" class="grid gap-2 md:grid-cols-2">
            <div
              v-for="rewardResult in rowData.rewardResultSnapshots"
              :key="rewardResult.transactionId"
              class="rounded-md border p-3 text-sm"
            >
              <div class="font-medium">{{ rewardResult.points }} 点</div>
              <div class="text-muted-foreground">交易 {{ rewardResult.transactionId }}</div>
              <Badge v-if="rewardResult.duplicated" class="mt-2" size="sm" variant="secondary">
                已幂等跳过
              </Badge>
            </div>
          </div>
          <div v-else class="text-muted-foreground text-sm">暂无发放记录</div>
        </div>
      </div>
    </template>
  </DataTable>

  <BiliGuardManualCreateDialog v-model:open="manualCreateDialogOpen" />
</template>
