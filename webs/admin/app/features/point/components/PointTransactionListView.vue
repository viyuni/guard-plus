<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { PointTransactionPageQuery } from '@shared/schema/point-transaction';
import type { ColumnDef } from '@tanstack/vue-table';
import { DataTable } from '@web/ui/components/ui/table';

import type { AdminApi } from '~/plugins/api';

import { pointTransactionPageQuery } from '../queries';
import PointTransactionActionsDropdown from './PointTransactionActionsDropdown.vue';

export type PointTransactionListPage = Treaty.Data<AdminApi['points']['transactions']['get']>;
export type PointTransaction = NonNullable<PointTransactionListPage>['items'][number];
type PointTransactionColumns = readonly ColumnDef<PointTransaction>[];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'user', header: '用户名' },
  { id: 'uid', header: 'UID' },
  { accessorKey: 'pointTypeNameSnapshot', header: '积分类型' },
  { accessorKey: 'title', header: '类型' },
  { accessorKey: 'delta', header: '变动' },
  { accessorKey: 'balanceBefore', header: '变动前' },
  { accessorKey: 'balanceAfter', header: '变动后' },
  { accessorKey: 'sourceType', header: '来源' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { id: 'actions', enableHiding: false },
] as const satisfies PointTransactionColumns;

const {
  stateRefs: { page, pageSize, type },
  query,
} = useDebouncedPageQuery<PointTransactionPageQuery>({
  type: undefined,
  pointTypeId: undefined,
  userId: undefined,
  startAt: undefined,
  endAt: undefined,
});

const { items: transactions, meta } = usePageQuery(() => pointTransactionPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="transactions"
    :columns="columns"
    :total="meta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <NativeSelect v-model:model-value="type">
        <NativeSelectOption value="">流水类型</NativeSelectOption>
        <NativeSelectOption value="grant">发放</NativeSelectOption>
        <NativeSelectOption value="consume">消费</NativeSelectOption>
        <NativeSelectOption value="refund">退款</NativeSelectOption>
        <NativeSelectOption value="adjust">调整</NativeSelectOption>
        <NativeSelectOption value="reversal">冲正</NativeSelectOption>
      </NativeSelect>
    </template>

    <template #user="{ value }">
      {{ value?.username }}
    </template>

    <template #uid="{ rowData }">
      {{ rowData?.user?.biliUid }}
    </template>

    <template #title="{ rowData }">
      {{ rowData.title }}
    </template>

    <template #delta="{ value }">
      <SignedAmount :value="value" />
    </template>

    <template #createdAt="{ value }">
      {{ value?.toLocaleString() ?? '-' }}
    </template>

    <template #actions="{ rowData }">
      <PointTransactionActionsDropdown :transaction="rowData" />
    </template>
  </DataTable>
</template>
