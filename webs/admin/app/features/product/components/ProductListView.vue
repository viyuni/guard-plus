<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { ProductPageQuery, ProductStatus } from '@shared/schema/product';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { ImageUp, MoreHorizontal, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useDeleteProduct, useUpdateProduct } from '../mutations';
import { productPageQuery } from '../queries';
import AdjustProductStockDialog from './AdjustProductStockDialog.vue';
import ProductCoverDialog from './ProductCoverDialog.vue';
import ProductDialog from './ProductDialog.vue';
import ProductStatusSelect from './ProductStatusSelect.vue';

export type ProductListPage = Treaty.Data<AdminApi['products']['get']>;
export type Product = NonNullable<ProductListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'cover', header: '封面' },
  { accessorKey: 'name', header: '商品名称' },
  { accessorKey: 'pointType.name', header: '积分类型' },
  { accessorKey: 'price', header: '价格' },
  { accessorKey: 'stock', header: '库存' },
  { accessorKey: 'deliveryType', header: '发货方式' },
  { accessorKey: 'sort', header: '排序' },
  { accessorKey: 'startAt', header: '开始时间' },
  { accessorKey: 'endAt', header: '结束时间' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<Product>[];

const {
  stateRefs: { page, pageSize, keyword, status, deliveryType },
  query,
} = useDebouncedPageQuery<ProductPageQuery>({
  status: undefined,
  deliveryType: undefined,
  pointTypeId: undefined,
});

const { items: products, meta: productMeta } = usePageQuery(() => productPageQuery(query.value));
const [openAdjustProductStockDialog] = useOverlay(AdjustProductStockDialog);
const [openProductCoverDialog] = useOverlay(ProductCoverDialog);
const [openProductDialog] = useOverlay(ProductDialog);
const { mutate: updateProduct, isLoading: isUpdatingProduct } = useUpdateProduct();
const { mutate: deleteProduct, isLoading: isDeleting } = useDeleteProduct();
const { getImageUrl } = useImage();

function updateProductStatus(product: Product, status?: ProductStatus | '') {
  if (status && status !== product.status) {
    updateProduct({
      productId: product.id,
      body: { status },
    });
  }
}
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="products"
    :columns="columns"
    :total="productMeta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2">
        <Input
          class="max-w-xs"
          placeholder="搜索商品名称 / 描述"
          v-model:model-value.trim="keyword"
        />
        <ProductStatusSelect v-model="status" />
        <NativeSelect v-model:model-value="deliveryType">
          <NativeSelectOption value="">发货方式</NativeSelectOption>
          <NativeSelectOption value="manual">人工发货</NativeSelectOption>
          <NativeSelectOption value="automatic">自动发货</NativeSelectOption>
        </NativeSelect>

        <Button class="ml-auto" @click="openProductDialog()">
          <Plus />
          添加商品
        </Button>
      </div>
    </template>

    <template #cover="{ value }">
      <div
        class="bg-muted flex h-12 w-12 items-center justify-center overflow-hidden rounded border"
      >
        <img v-if="value" class="h-full w-full object-cover" :src="getImageUrl(value)" alt="" />
        <span v-else class="text-muted-foreground text-xs">无</span>
      </div>
    </template>

    <template #deliveryType="{ value }">
      {{ value === 'automatic' ? '自动发货' : '人工发货' }}
    </template>

    <template #startAt="{ value }">
      {{ value ? new Date(value).toLocaleString() : '-' }}
    </template>

    <template #endAt="{ value }">
      {{ value ? new Date(value).toLocaleString() : '-' }}
    </template>

    <template #status="{ rowData }">
      <ProductStatusSelect
        class="min-w-24"
        required
        size="sm"
        :disabled="isUpdatingProduct"
        :model-value="rowData.status"
        @update:model-value="updateProductStatus(rowData, $event)"
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
          <DropdownMenuItem @click="openProductDialog({ product: rowData })">
            <Pencil />
            编辑商品
          </DropdownMenuItem>
          <DropdownMenuItem @click="openProductCoverDialog({ product: rowData })">
            <ImageUp />
            更新封面
          </DropdownMenuItem>
          <DropdownMenuItem @click="openAdjustProductStockDialog({ product: rowData })">
            <PackagePlus />
            调整库存
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            :disabled="isDeleting"
            @click="deleteProduct(rowData.id)"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
