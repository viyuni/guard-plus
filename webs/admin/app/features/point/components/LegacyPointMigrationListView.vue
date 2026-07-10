<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { LegacyPointMigrationPageQuery } from '@shared/schema/point-account';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal, Play, Plus, Trash2 } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useDeleteLegacyPointMigration, useReplayLegacyPointMigration } from '../mutations';
import { legacyPointMigrationPageQuery } from '../queries';
import LegacyPointMigrationCreateDialog from './LegacyPointMigrationCreateDialog.vue';

export type LegacyPointMigrationListPage = Treaty.Data<
  AdminApi['points']['accounts']['legacy-migrations']['get']
>;
export type LegacyPointMigration = NonNullable<LegacyPointMigrationListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'biliUid', header: 'UID' },
  { accessorKey: 'pointType', header: '积分类型' },
  { accessorKey: 'points', header: '积分' },
  { accessorKey: 'replayedAt', header: '状态' },
  { accessorKey: 'createdAt', header: '录入时间' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<LegacyPointMigration>[];

const {
  stateRefs: { page, pageSize, biliUid, status },
  query,
} = useDebouncedPageQuery<LegacyPointMigrationPageQuery>({
  biliUid: undefined,
  pointTypeId: undefined,
  status: undefined,
});

const {
  items: migrations,
  meta,
  isLoading: isTableLoading,
} = usePageQuery(() => legacyPointMigrationPageQuery(query.value));
const [openCreateDialog] = useOverlay(LegacyPointMigrationCreateDialog);
const { mutate: deleteMigration, isLoading: isDeleting } = useDeleteLegacyPointMigration();
const { mutate: replayMigration, isLoading: isReplaying } = useReplayLegacyPointMigration();
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="migrations"
    :columns="columns"
    :total="meta?.total"
    :page-size="pageSize"
    :loading="isTableLoading"
  >
    <template #toolbar>
      <DataTableToolbar>
        <Input v-model:model-value.trim="biliUid" inputmode="numeric" placeholder="搜索 UID" />
        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">迁移状态</NativeSelectOption>
          <NativeSelectOption value="pending">待回放</NativeSelectOption>
          <NativeSelectOption value="replayed">已回放</NativeSelectOption>
        </NativeSelect>

        <template #actions>
          <Button @click="openCreateDialog()">
            <Plus />
            录入迁移积分
          </Button>
        </template>
      </DataTableToolbar>
    </template>

    <template #pointType="{ value }">
      {{ value?.name ?? '-' }}
    </template>

    <template #replayedAt="{ value }">
      <Badge :variant="value ? 'secondary' : 'outline'">
        {{ value ? '已回放' : '待回放' }}
      </Badge>
    </template>

    <template #createdAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
    </template>

    <template #actions="{ rowData }">
      <DropdownMenu v-if="!rowData.replayedAt">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span class="sr-only">打开操作菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-50">
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem :disabled="isReplaying" @click="replayMigration(rowData.id)">
            <Play />
            手动迁移
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            :disabled="isDeleting"
            @click="deleteMigration(rowData.id)"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
