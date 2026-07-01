<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { OrderPageQuery } from '@shared/schema/order';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { Checkbox } from '@web/ui/components/ui/checkbox';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import {
  CheckCircle2,
  Download,
  Eye,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  Truck,
} from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useCompleteOrder, useExportOrders } from '../mutations';
import { orderPageQuery } from '../queries';
import OrderDetailDialog from './OrderDetailDialog.vue';
import OrderExpressDialog from './OrderExpressDialog.vue';
import OrderReceiverDialog from './OrderReceiverDialog.vue';
import RefundOrderDialog from './RefundOrderDialog.vue';

export type OrderListPage = Treaty.Data<AdminApi['orders']['get']>;
export type Order = NonNullable<OrderListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { id: 'select', enableHiding: false },
  { accessorKey: 'orderNo', header: '订单号' },
  { accessorKey: 'productNameSnapshot', header: '商品' },
  { accessorKey: 'pointTypeNameSnapshot', header: '积分类型' },
  { accessorKey: 'price', header: '价格' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<Order>[];

const {
  stateRefs: { page, pageSize, keyword, status },
  query,
} = useDebouncedPageQuery<OrderPageQuery>({
  status: undefined,
  startAt: undefined,
  endAt: undefined,
  userId: undefined,
});

const { items: orders, meta: orderMeta } = usePageQuery(() => orderPageQuery(query.value));
const [openOrderDetailDialog] = useOverlay(OrderDetailDialog);
const [openOrderExpressDialog] = useOverlay(OrderExpressDialog);
const [openOrderReceiverDialog] = useOverlay(OrderReceiverDialog);
const [openRefundOrderDialog] = useOverlay(RefundOrderDialog);
const { mutate: completeOrder, isLoading: isCompleting } = useCompleteOrder();
const { mutateAsync: exportOrders, isLoading: isExporting } = useExportOrders();
const selectedOrderIds = ref(new Set<string>());
const selectedOrderCount = computed(() => selectedOrderIds.value.size);
const currentPageOrderIds = computed(() => orders.value.map(order => order.id));
const currentPageSelectedCount = computed(
  () => currentPageOrderIds.value.filter(id => selectedOrderIds.value.has(id)).length,
);
const isCurrentPageSelected = computed(
  () =>
    currentPageOrderIds.value.length > 0 &&
    currentPageSelectedCount.value === currentPageOrderIds.value.length,
);
const selectAllModel = computed(
  () => isCurrentPageSelected.value || (currentPageSelectedCount.value > 0 && 'indeterminate'),
);

watch([keyword, status], () => {
  selectedOrderIds.value = new Set();
});

function canCompleteOrder(order: Order) {
  return order.status === 'pending';
}

function canRefundOrder(order: Order) {
  return order.status === 'pending' || order.status === 'completed';
}

function canUpdateExpress(order: Order) {
  return order.status !== 'refunded' && order.deliveryTypeSnapshot === 'manual';
}

async function handleExportOrders() {
  const ids = [...selectedOrderIds.value];

  if (!ids.length) {
    return;
  }

  const { data } = await exportOrders({ ids });

  if (!data) {
    return;
  }

  downloadCsv(data.filename, data.content);
}

function toggleCurrentPageOrders(value: boolean | 'indeterminate') {
  const next = new Set(selectedOrderIds.value);

  if (value && value !== 'indeterminate') {
    currentPageOrderIds.value.forEach(id => next.add(id));
  } else {
    currentPageOrderIds.value.forEach(id => next.delete(id));
  }

  selectedOrderIds.value = next;
}

function toggleOrder(orderId: string, value: boolean | 'indeterminate') {
  const next = new Set(selectedOrderIds.value);

  if (value && value !== 'indeterminate') {
    next.add(orderId);
  } else {
    next.delete(orderId);
  }

  selectedOrderIds.value = next;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="orders"
    :columns="columns"
    :total="orderMeta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <DataTableToolbar>
        <Input placeholder="搜索商品 / 积分类型" v-model:model-value.trim="keyword" />
        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">订单状态</NativeSelectOption>
          <NativeSelectOption value="pending">待处理</NativeSelectOption>
          <NativeSelectOption value="completed">已完成</NativeSelectOption>
          <NativeSelectOption value="refunded">已退款</NativeSelectOption>
        </NativeSelect>
        <template #actions>
          <Button
            variant="outline"
            :disabled="!selectedOrderCount || isExporting"
            @click="handleExportOrders"
          >
            <Download />
            导出{{ selectedOrderCount ? ` (${selectedOrderCount})` : '' }}
          </Button>
        </template>
      </DataTableToolbar>
    </template>

    <template #select-header>
      <Checkbox
        aria-label="全选订单"
        :disabled="!orders.length"
        :model-value="selectAllModel"
        @update:model-value="toggleCurrentPageOrders"
      />
    </template>

    <template #select="{ rowData }">
      <Checkbox
        aria-label="选择订单"
        :model-value="selectedOrderIds.has(rowData.id)"
        @update:model-value="toggleOrder(rowData.id, $event)"
      />
    </template>

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
      {{ value ? new Date(value).toLocaleString() : '-' }}
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
          <DropdownMenuItem @click="openOrderDetailDialog({ order: rowData })">
            <Eye />
            查看详情
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!canUpdateExpress(rowData)"
            @click="openOrderExpressDialog({ order: rowData })"
          >
            <Truck />
            填写快递信息
          </DropdownMenuItem>
          <DropdownMenuItem @click="openOrderReceiverDialog({ order: rowData })">
            <MapPin />
            修改收货信息
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            :disabled="!canCompleteOrder(rowData) || isCompleting"
            @click="completeOrder(rowData.id)"
          >
            <CheckCircle2 />
            完成订单
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            :disabled="!canRefundOrder(rowData)"
            @click="openRefundOrderDialog({ order: rowData })"
          >
            <RotateCcw />
            退款订单
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
