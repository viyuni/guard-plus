<script setup lang="ts">
import { PointTypeIconUploadSchema } from '@shared/schema/point-type';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdatePointTypeIcon } from '../mutations';
import PointTypeIconInput from './PointTypeIconInput.vue';
import type { PointType } from './PointTypeListView.vue';

const props = defineProps<{
  pointType: PointType;
}>();

const open = defineModel<boolean>('open', { default: false });

const pointTypeIconInput = ref<InstanceType<typeof PointTypeIconInput>>();
const updatePointTypeIconMutation = useUpdatePointTypeIcon();
const { getImageUrl } = useImage();
const currentIconUrl = computed(() =>
  props.pointType.icon ? getImageUrl(props.pointType.icon) : undefined,
);

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess } = usePopoverForm({
  schema: PointTypeIconUploadSchema,
  open,
  resetOnSuccess: true,
  initialValues: () => ({
    icon: undefined,
  }),
  mutation: updatePointTypeIconMutation,
  transform(body) {
    return {
      pointTypeId: props.pointType.id,
      body,
    };
  },
});

function resetSelectedIcon() {
  pointTypeIconInput.value?.reset();
}

onSubmitSuccess(() => {
  resetSelectedIcon();
});

watch(open, isOpen => {
  if (!isOpen) {
    resetSelectedIcon();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>更新图标</DialogTitle>
        <DialogDescription>{{ pointType.name }}</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="icon" label="图标" required>
          <PointTypeIconInput
            ref="pointTypeIconInput"
            v-bind="componentField"
            :current-icon-url="currentIconUrl"
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
