<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ColumnDef } from '@tanstack/vue-table';
import { DataTable } from '@web/ui/components/ui/table';
import { Eye } from 'lucide-vue-next';

import type { UserApi } from '~/plugins/api';
import { formatDate } from '~/utils/date';

import { useUserOrdersQuery } from '../queries';
import PurchaseDetailDialog from './PurchaseDetailDialog.vue';

type OrderListPage = Treaty.Data<UserApi['orders']['get']>;
type Order = NonNullable<OrderListPage>['items'][number];
</script>

<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });
const detailDialogOpen = ref(false);
const selectedOrder = ref<Order>();
const { data: orders } = useUserOrdersQuery();

const columns = [
  { accessorKey: 'productNameSnapshot', header: '商品' },
  { accessorKey: 'orderNo', header: '订单号' },
  { accessorKey: 'pointTypeNameSnapshot', header: '积分类型' },
  { accessorKey: 'price', header: '价格' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { id: 'actions', enableHiding: false },
] as const satisfies readonly ColumnDef<Order>[];

function openDetailDialog(order: Order) {
  selectedOrder.value = order;
  detailDialogOpen.value = true;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-5xl"
    >
      <DialogHeader>
        <DialogTitle>我的订单</DialogTitle>
        <DialogDescription>最近 20 条兑换订单。</DialogDescription>
      </DialogHeader>

      <DataTable
        :data="orders?.items ?? []"
        :columns="columns"
        hide-footer
        :page-size="20"
        scroll-y
        scroll-area-class="max-h-[calc(100svh-10rem)] pr-1"
      >
        <template #status="{ value }">
          <Badge
            size="sm"
            :variant="
              value === 'refunded' ? 'destructive' : value === 'completed' ? 'outline' : 'secondary'
            "
          >
            {{ value === 'pending' ? '待处理' : value === 'completed' ? '已完成' : '已退款' }}
          </Badge>
        </template>

        <template #createdAt="{ value }">
          {{ formatDate(value) }}
        </template>

        <template #actions="{ rowData }">
          <Button
            type="button"
            size="sm"
            variant="outline"
            :disabled="!rowData.productDeliveryContentSnapshot"
            @click="openDetailDialog(rowData)"
          >
            <Eye class="size-4" />
            查看详情
          </Button>
        </template>

        <template #empty>暂无订单</template>
      </DataTable>
    </DialogContent>
  </Dialog>

  <PurchaseDetailDialog
    v-model:open="detailDialogOpen"
    :order-no="selectedOrder?.orderNo"
    :detail="selectedOrder?.productDeliveryContentSnapshot"
  />
</template>
