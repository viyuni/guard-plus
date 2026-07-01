<script setup lang="ts">
import { ProductCoverUploadSchema } from '@shared/schema/product';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateProductCover } from '../mutations';
import ProductCoverCropInput from './ProductCoverCropInput.vue';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product: Product;
}>();

const open = defineModel<boolean>('open', { default: false });

const productCoverCropInput = ref<InstanceType<typeof ProductCoverCropInput>>();
const updateProductCoverMutation = useUpdateProductCover();
const { getImageUrl } = useImage();
const currentCoverUrl = computed(() =>
  props.product.cover ? getImageUrl(props.product.cover) : undefined,
);

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess } = usePopoverForm({
  schema: ProductCoverUploadSchema,
  open,
  resetOnSuccess: true,
  initialValues: () => ({
    cover: undefined,
  }),
  mutation: updateProductCoverMutation,
  async transform(body) {
    const cover = await productCoverCropInput.value?.exportCroppedCover();

    return {
      productId: props.product.id,
      body: {
        ...body,
        cover: cover ?? body.cover,
      },
    };
  },
});

function resetSelectedCover() {
  productCoverCropInput.value?.reset();
}

onSubmitSuccess(() => {
  resetSelectedCover();
});

watch(open, isOpen => {
  if (!isOpen) {
    resetSelectedCover();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-120">
      <DialogHeader>
        <DialogTitle>更新封面</DialogTitle>
        <DialogDescription>{{ product.name }}</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="cover" label="封面" required>
          <ProductCoverCropInput
            ref="productCoverCropInput"
            v-bind="componentField"
            :current-cover-url="currentCoverUrl"
            :preview-size="380"
          />
        </FormFieldItem>

        <DialogFooter>
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
