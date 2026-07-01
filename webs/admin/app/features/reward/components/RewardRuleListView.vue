<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useDeleteRewardRule, useDisableRewardRule, useEnableRewardRule } from '../mutations';
import { rewardRuleListQuery } from '../queries';
import RewardRuleDialog from './RewardRuleDialog.vue';

export type RewardRuleList = Treaty.Data<AdminApi['rewards']['rules']['get']>;
export type RewardRule = NonNullable<RewardRuleList>[number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'name', header: '规则名称' },
  { accessorKey: 'pointType.name', header: '积分类型' },
  { accessorKey: 'points', header: '奖励积分' },
  { accessorKey: 'group', header: '互斥分组' },
  { accessorKey: 'priority', header: '优先级' },
  { accessorKey: 'startAt', header: '开始时间' },
  { accessorKey: 'endAt', header: '结束时间' },
  { accessorKey: 'enabled', header: '状态' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<RewardRule>[];

const { data: rules } = useQuery(rewardRuleListQuery);
const { mutate: enableRewardRule, isLoading: isEnabling } = useEnableRewardRule();
const { mutate: disableRewardRule, isLoading: isDisabling } = useDisableRewardRule();
const { mutate: deleteRewardRule, isLoading: isDeleting } = useDeleteRewardRule();
const [openRewardRuleDialog] = useOverlay(RewardRuleDialog);

const isUpdatingEnabled = computed(() => isEnabling.value || isDisabling.value);

function toggleRewardRuleEnabled(rule: RewardRule, enabled: boolean) {
  if (enabled) {
    enableRewardRule(rule.id);
  } else {
    disableRewardRule(rule.id);
  }
}
</script>

<template>
  <DataTable :data="rules ?? []" :columns="columns" hide-footer>
    <template #toolbar>
      <DataTableToolbar>
        <template #actions>
          <Button @click="openRewardRuleDialog()">
            <Plus />
            添加积分规则
          </Button>
        </template>
      </DataTableToolbar>
    </template>

    <template #group="{ value }">
      {{ value ?? '-' }}
    </template>

    <template #startAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
    </template>

    <template #endAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
    </template>

    <template #enabled="{ value, rowData }">
      <Switch
        :model-value="value"
        :disabled="isUpdatingEnabled"
        @update:model-value="toggleRewardRuleEnabled(rowData, $event)"
      />
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
          <DropdownMenuItem @click="openRewardRuleDialog({ rule: rowData })">
            <Pencil />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            :disabled="isDeleting"
            @click="deleteRewardRule(rowData.id)"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
