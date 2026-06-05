<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { DataTable } from '@web/ui/components/ui/table';

import type { UserApi } from '~/plugins/api';
import { formatDate } from '~/utils/date';

import { useUserPointTransactionsQuery } from '../queries';

type PointTransactionListPage = Treaty.Data<UserApi['pointTransactions']['get']>;
type PointTransaction = NonNullable<PointTransactionListPage>['items'][number];
</script>

<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });
const { data: transactions } = useUserPointTransactionsQuery();

const columns = [
  { accessorKey: 'pointTypeNameSnapshot', header: '积分类型' },
  { accessorKey: 'title', header: '类型' },
  { accessorKey: 'delta', header: '变动' },
  { accessorKey: 'balanceBefore', header: '变动前' },
  { accessorKey: 'balanceAfter', header: '变动后' },
  { accessorKey: 'createdAt', header: '创建时间' },
] as const satisfies readonly ColumnDef<PointTransaction>[];
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-4xl"
    >
      <DialogHeader>
        <DialogTitle>积分流水</DialogTitle>
        <DialogDescription>最近 20 条积分变动。</DialogDescription>
      </DialogHeader>

      <DataTable
        :data="transactions?.items ?? []"
        :columns="columns"
        hide-footer
        :page-size="20"
        scroll-y
        scroll-area-class="max-h-[calc(100svh-10rem)] pr-1"
      >
        <template #delta="{ value }">
          <SignedAmount :value="value" />
        </template>

        <template #createdAt="{ value }">
          {{ formatDate(value) }}
        </template>

        <template #empty>暂无流水</template>
      </DataTable>
    </DialogContent>
  </Dialog>
</template>
