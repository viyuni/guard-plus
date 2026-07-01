<script setup lang="ts">
import { ProductDeliveryType, ProductStatus, UpdateProductSchema } from '@shared/schema/product';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import PointTypeSelect from '../../point/components/PointTypeSelect.vue';
import { useUpdateProduct } from '../mutations';
import type { Product } from './ProductListView.vue';
import ProductStatusSelect from './ProductStatusSelect.vue';

const props = defineProps<{
  product: Product;
}>();

const open = defineModel<boolean>('open', { default: false });

const updateProductMutation = useUpdateProduct();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UpdateProductSchema,
  open,
  initialValues: () => ({
    name: props.product?.name ?? '',
    description: props.product?.description ?? undefined,
    detail: props.product?.detail ?? undefined,
    deliveryContent: props.product?.deliveryContent ?? undefined,
    pointTypeId: props.product?.pointTypeId ?? '',
    price: props.product?.price ?? 1,
    status: props.product?.status ?? ProductStatus.Disabled,
    stock: props.product?.stock ?? 0,
    deliveryType: props.product?.deliveryType ?? ProductDeliveryType.Manual,
    startAt: props.product?.startAt,
    endAt: props.product?.endAt,
    allowCancel: false,
    sort: props.product?.sort ?? undefined,
    metadata: undefined,
  }),
  mutation: updateProductMutation,
  transform(body) {
    return {
      productId: props.product.id,
      body,
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>编辑商品</DialogTitle>
        <DialogDescription>更新商品信息和展示内容。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="name" label="商品名称" required>
          <Input v-bind="componentField" placeholder="例如：限定周边" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="pointTypeId" label="积分类型" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择积分类型" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="price" label="兑换价格" required>
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="stock" label="初始库存" required>
          <Input v-bind="componentField" type="number" min="0" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="deliveryType" label="发货方式" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption :value="ProductDeliveryType.Manual">人工发货</NativeSelectOption>
            <NativeSelectOption :value="ProductDeliveryType.Automatic">自动发货</NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="status" label="商品状态" required>
          <ProductStatusSelect v-bind="componentField" required />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="startAt" label="开始时间">
          <DateTimeLocalInput
            v-bind="componentField"
            empty-as-null
            type="datetime-local"
            step="1"
          />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="endAt" label="结束时间">
          <DateTimeLocalInput
            v-bind="componentField"
            empty-as-null
            type="datetime-local"
            step="1"
          />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="allowCancel" label="允许取消订单" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption :value="false">不允许</NativeSelectOption>
            <NativeSelectOption :value="true">允许</NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="sort" label="排序">
          <Input v-bind="componentField" type="number" step="1" placeholder="留空优先展示" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2 lg:col-span-3"
          name="description"
          label="描述"
        >
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2 lg:col-span-3"
          name="detail"
          label="详情"
        >
          <Textarea
            v-bind="componentField"
            placeholder="可选，支持 Markdown / HTML / 富文本 JSON"
          />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2 lg:col-span-3"
          name="deliveryContent"
          label="自动发货内容"
        >
          <Textarea v-bind="componentField" placeholder="可选，兑换成功后向用户展示" />
        </FormFieldItem>

        <DialogFooter class="sm:col-span-2 lg:col-span-3">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
