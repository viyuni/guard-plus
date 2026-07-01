<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { ArrowRightLeft, MoreHorizontal, Pencil, Play, Plus, Trash2 } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import {
  useDeletePointConversionRule,
  useDisablePointConversionRule,
  useEnablePointConversionRule,
} from '../mutations';
import { pointConversionListQuery } from '../queries';
import ConvertPointDialog from './ConvertPointDialog.vue';
import PointConversionRuleDialog from './PointConversionRuleDialog.vue';

export type PointConversionList = Treaty.Data<AdminApi['points']['conversions']['get']>;
export type PointConversion = NonNullable<PointConversionList>[number] & {
  fromPointTypeName?: string;
  toPointTypeName?: string;
};
export type PointConversionColumns = readonly ColumnDef<PointConversion>[];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'name', header: '规则名称' },
  { accessorKey: 'fromPointType', header: '来源积分' },
  { accessorKey: 'toPointType', header: '目标积分' },
  { accessorKey: 'toAmount', header: '目标数量' },
  { accessorKey: 'minConvertAmount', header: '最小转换' },
  { accessorKey: 'maxConvertAmount', header: '最大转换' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { accessorKey: 'enabled', header: '状态' },
  { accessorKey: 'startAt', header: '开始时间' },
  { accessorKey: 'endAt', header: '结束时间' },
  { id: 'actions', enableHiding: false },
] as const satisfies PointConversionColumns;

const { data: conversions } = useQuery(pointConversionListQuery);
const { mutate: enableConversionRule, isLoading: isEnabling } = useEnablePointConversionRule();
const { mutate: disableConversionRule, isLoading: isDisabling } = useDisablePointConversionRule();
const { mutate: deleteConversionRule, isLoading: isDeleting } = useDeletePointConversionRule();
const [openConversionRuleDialog] = useOverlay(PointConversionRuleDialog);
const [openConvertPointDialog] = useOverlay(ConvertPointDialog);

const isUpdatingEnabled = computed(() => isEnabling.value || isDisabling.value);

function toggleConversionRuleEnabled(conversion: PointConversion, enabled: boolean) {
  if (enabled) {
    enableConversionRule(conversion.id);
  } else {
    disableConversionRule(conversion.id);
  }
}
</script>

<template>
  <DataTable :data="conversions ?? []" :columns="columns" hide-footer>
    <template #toolbar>
      <DataTableToolbar>
        <template #actions>
          <Button @click="openConversionRuleDialog()">
            <Plus />
            添加积分转换
          </Button>
        </template>
      </DataTableToolbar>
    </template>

    <template #fromPointType="{ value }">
      {{ value?.name }}
    </template>

    <template #toPointType="{ value }">
      {{ value?.name }}
    </template>

    <template #toAmount="{ value }">
      <div class="flex items-center gap-1">
        <ArrowRightLeft class="text-muted-foreground size-3.5" />
        {{ value }}
      </div>
    </template>

    <template #minConvertAmount="{ value }">
      {{ value ?? '-' }}
    </template>

    <template #maxConvertAmount="{ value }">
      {{ value ?? '-' }}
    </template>

    <template #enabled="{ value, rowData }">
      <Switch
        :model-value="value"
        :disabled="isUpdatingEnabled"
        @update:model-value="toggleConversionRuleEnabled(rowData, $event)"
      />
    </template>

    <template #startAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
    </template>

    <template #endAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
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
          <DropdownMenuItem @click="openConversionRuleDialog({ conversion: rowData })">
            <Pencil />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!rowData.enabled"
            @click="openConvertPointDialog({ conversion: rowData })"
          >
            <Play />
            执行转换
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            :disabled="isDeleting"
            @click="deleteConversionRule(rowData.id)"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
