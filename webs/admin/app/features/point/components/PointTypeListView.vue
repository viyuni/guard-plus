<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { ImageIcon, MoreHorizontal, Pencil, Plus } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useDisablePointType, useEnablePointType } from '../mutations';
import { pointTypeListQuery } from '../queries';
import PointTypeDialog from './PointTypeDialog.vue';
import PointTypeIconDialog from './PointTypeIconDialog.vue';

export type PointTypeList = Treaty.Data<AdminApi['points']['types']['get']>;
export type PointType = NonNullable<PointTypeList>[number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'icon', header: '图标' },
  { accessorKey: 'name', header: '名称' },
  { accessorKey: 'description', header: '描述' },
  { accessorKey: 'sort', header: '排序' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<PointType>[];

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutate: enablePointType, isLoading: isEnabling } = useEnablePointType();
const { mutate: disablePointType, isLoading: isDisabling } = useDisablePointType();
const [openPointTypeDialog] = useOverlay(PointTypeDialog);
const [openPointTypeIconDialog] = useOverlay(PointTypeIconDialog);
const { getImageUrl } = useImage();

const isUpdatingStatus = computed(() => isEnabling.value || isDisabling.value);

function togglePointTypeStatus(pointType: PointType, enabled: boolean) {
  if (enabled) {
    enablePointType(pointType.id);
  } else {
    disablePointType(pointType.id);
  }
}
</script>

<template>
  <DataTable :data="pointTypes ?? []" :columns="columns" hide-footer>
    <template #toolbar>
      <div class="flex w-full items-center justify-end">
        <Button @click="openPointTypeDialog()">
          <Plus />
          添加积分类型
        </Button>
      </div>
    </template>

    <template #description="{ value }">
      {{ value ?? '-' }}
    </template>

    <template #icon="{ value }">
      <div
        class="bg-muted/40 flex size-10 items-center justify-center overflow-hidden rounded-md border"
      >
        <img
          v-if="value"
          class="h-full w-full object-contain"
          :src="getImageUrl(value)"
          alt="Point type icon"
        />
      </div>
    </template>

    <template #status="{ value, rowData }">
      <Switch
        :model-value="value === 'active'"
        :disabled="isUpdatingStatus"
        @update:model-value="togglePointTypeStatus(rowData, $event)"
      />
    </template>

    <template #createdAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
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
          <DropdownMenuItem @click="openPointTypeDialog({ pointType: rowData })">
            <Pencil />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem @click="openPointTypeIconDialog({ pointType: rowData })">
            <ImageIcon />
            更新图标
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
