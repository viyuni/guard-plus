<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { StockMovementPageQuery } from '@shared/schema/stock';
import type { ColumnDef } from '@tanstack/vue-table';
import { DataTable } from '@web/ui/components/ui/table';

import type { AdminApi } from '~/plugins/api';

import { stockMovementPageQuery } from '../queries';

export type StockMovementListPage = Treaty.Data<AdminApi['products']['stock']['movements']['get']>;
export type StockMovement = NonNullable<StockMovementListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'product', header: '商品名' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'delta', header: '变动' },
  { accessorKey: 'stockBefore', header: '变动前' },
  { accessorKey: 'stockAfter', header: '变动后' },
  { accessorKey: 'sourceType', header: '来源' },
  { accessorKey: 'createdAt', header: '创建时间' },
] satisfies ColumnDef<StockMovement>[];

const {
  stateRefs: { page, pageSize, type },
  query,
} = useDebouncedPageQuery<StockMovementPageQuery>({
  type: undefined,
  productId: undefined,
  startAt: undefined,
  endAt: undefined,
});

const {
  items: movements,
  meta,
  isLoading: isTableLoading,
} = usePageQuery(() => stockMovementPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="movements"
    :columns="columns"
    :total="meta?.total"
    :page-size="pageSize"
    :loading="isTableLoading"
  >
    <template #toolbar>
      <DataTableToolbar>
        <NativeSelect v-model:model-value="type">
          <NativeSelectOption value="">库存变动类型</NativeSelectOption>
          <NativeSelectOption value="consume">兑换扣减</NativeSelectOption>
          <NativeSelectOption value="restore">恢复库存</NativeSelectOption>
          <NativeSelectOption value="adjust">手动调整</NativeSelectOption>
        </NativeSelect>
      </DataTableToolbar>
    </template>
    <template #product="{ value }">
      {{ value?.name }}
    </template>

    <template #type="{ value }">
      {{ value === 'consume' ? '兑换扣减' : value === 'restore' ? '恢复库存' : '手动调整' }}
    </template>

    <template #delta="{ value }">
      <SignedAmount :value="value" />
    </template>

    <template #createdAt="{ value }">
      {{ value ? new Date(value).toLocaleString() : '-' }}
    </template>
  </DataTable>
</template>
