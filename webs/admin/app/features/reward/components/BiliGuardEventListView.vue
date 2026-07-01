<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { BiliEventPageQuery } from '@shared/schema/reward';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { Activity, Eye, Loader2, MoreHorizontal, Plus, RotateCcw } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useAdminSession } from '../../auth';
import { useCheckEventService } from '../../event';
import { useReplayBiliGuardReward } from '../mutations';
import { biliGuardEventPageQuery } from '../queries';
import BiliGuardEventDetailDialog from './BiliGuardEventDetailDialog.vue';
import BiliGuardManualCreateDialog from './BiliGuardManualCreateDialog.vue';

export type BiliGuardEventListPage = Treaty.Data<AdminApi['rewards']['biliGuard']['get']>;
export type BiliGuardEvent = NonNullable<BiliGuardEventListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'biliEventId', header: '事件 ID' },
  { accessorKey: 'biliUid', header: 'UID' },
  { accessorKey: 'user.username', header: '用户' },
  { accessorKey: 'eventSnapshot.uname', header: 'B站用户昵称' },
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

const {
  items: events,
  meta,
  isLoading: isTableLoading,
} = usePageQuery(() => biliGuardEventPageQuery(query.value));
const { mutate: replayBiliGuardReward, isLoading: isReplaying } = useReplayBiliGuardReward();
const { mutate: checkEventService, isLoading: isCheckingEventService } = useCheckEventService();
const { user } = useAdminSession();
const [openEventDetailDialog] = useOverlay(BiliGuardEventDetailDialog);
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
    :loading="isTableLoading"
  >
    <template #toolbar>
      <DataTableToolbar>
        <Input placeholder="搜索事件 ID / UID" v-model:model-value.trim="keyword" />
        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">事件状态</NativeSelectOption>
          <NativeSelectOption value="processing">处理中</NativeSelectOption>
          <NativeSelectOption value="succeeded">成功</NativeSelectOption>
          <NativeSelectOption value="failed">失败</NativeSelectOption>
          <NativeSelectOption value="ignored">已忽略</NativeSelectOption>
        </NativeSelect>

        <template #actions>
          <Button
            v-if="user?.role === 'superAdmin'"
            type="button"
            variant="outline"
            :disabled="isCheckingEventService"
            @click="checkEventService()"
          >
            <Loader2 v-if="isCheckingEventService" class="animate-spin" />
            <Activity v-else />
            {{ isCheckingEventService ? '检测中' : '检测服务' }}
          </Button>

          <Button type="button" @click="manualCreateDialogOpen = true">
            <Plus />
            手动创建
          </Button>
        </template>
      </DataTableToolbar>

      <BiliGuardManualCreateDialog v-model:open="manualCreateDialogOpen" />
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

    <template #actions="{ rowData }">
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

          <DropdownMenuItem @click="openEventDetailDialog({ event: rowData })">
            <Eye />
            查看详情
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
  </DataTable>
</template>
