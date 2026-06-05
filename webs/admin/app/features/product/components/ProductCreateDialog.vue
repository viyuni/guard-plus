<script setup lang="ts">
import { CreateProductSchema, ProductDeliveryType, ProductStatus } from '@shared/schema/product';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import PointTypeSelect from '../../point/components/PointTypeSelect.vue';
import { useCreateProduct } from '../mutations';
import ProductStatusSelect from './ProductStatusSelect.vue';

const open = defineModel<boolean>('open', { default: false });

const createProductMutation = useCreateProduct();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: CreateProductSchema,
  open,
  initialValues: () => ({
    name: '',
    description: undefined,
    detail: undefined,
    deliveryContent: undefined,
    pointTypeId: '',
    price: 1,
    status: ProductStatus.Disabled,
    stock: 0,
    deliveryType: ProductDeliveryType.Manual,
    startAt: undefined,
    endAt: undefined,
    allowCancel: false,
    sort: null,
    metadata: undefined,
  }),
  mutation: createProductMutation,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>添加商品</DialogTitle>
        <DialogDescription>创建一个可兑换商品。</DialogDescription>
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
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="endAt" label="结束时间">
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
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
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
