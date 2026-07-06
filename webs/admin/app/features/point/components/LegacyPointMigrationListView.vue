<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { LegacyPointMigrationPageQuery } from '@shared/schema/point-account';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { Plus, Trash2 } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useDeleteLegacyPointMigration } from '../mutations';
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
      <Button
        v-if="!rowData.replayedAt"
        variant="ghost"
        size="icon-sm"
        :disabled="isDeleting"
        title="删除迁移记录"
        @click="deleteMigration(rowData.id)"
      >
        <Trash2 class="text-destructive" />
        <span class="sr-only">删除迁移记录</span>
      </Button>
    </template>
  </DataTable>
</template>
