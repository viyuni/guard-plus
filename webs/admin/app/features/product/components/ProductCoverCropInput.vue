<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { ImageCropper, type ImageCropperResult } from '@web/ui/components/ui/image-cropper';
import { ImagePlus, Upload, X } from 'lucide-vue-next';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    'aria-invalid'?: boolean;
    currentCoverUrl?: string;
    name?: string;
    previewSize?: number;
  }>(),
  {
    previewSize: 320,
  },
);

const emit = defineEmits<{
  blur: [event: FocusEvent];
}>();

const file = defineModel<File | undefined>();
const inputKey = ref(0);
const cropper = ref<{
  exportImage: () => Promise<ImageCropperResult>;
  reset: () => void;
}>();
const sourceUrl = ref<string>();
const isDragging = ref(false);

defineExpose({
  exportCroppedCover,
  reset,
});

function revokeSourceUrl() {
  if (sourceUrl.value) {
    URL.revokeObjectURL(sourceUrl.value);
    sourceUrl.value = undefined;
  }
}

function createCroppedCoverFile(result: ImageCropperResult) {
  const originalName = file.value?.name.replace(/\.[^.]+$/, '') || 'product-cover';

  return new File([result.blob], `${originalName}.png`, {
    type: result.blob.type || 'image/png',
  });
}

async function exportCroppedCover() {
  if (!cropper.value || !sourceUrl.value) {
    return file.value;
  }

  const result = await cropper.value.exportImage();

  return createCroppedCoverFile(result);
}

function reset() {
  file.value = undefined;
  inputKey.value += 1;
  isDragging.value = false;
}

function setFile(selectedFile: File | undefined) {
  inputKey.value += 1;

  if (!selectedFile || !selectedFile.type.startsWith('image/')) {
    return;
  }

  file.value = selectedFile;
}

function handleChange(event: Event) {
  const input = event.target as HTMLInputElement;

  setFile(input.files?.[0]);
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  setFile(event.dataTransfer?.files[0]);
}

watch(
  file,
  value => {
    revokeSourceUrl();

    if (value) {
      sourceUrl.value = URL.createObjectURL(value);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  revokeSourceUrl();
});
</script>

<template>
  <div class="grid gap-4">
    <div class="w-full rounded-md" :class="sourceUrl ? undefined : 'aspect-square overflow-hidden'">
      <div v-if="sourceUrl">
        <ImageCropper
          ref="cropper"
          :src="sourceUrl"
          :preview-size="previewSize"
          :output-size="512"
        />
      </div>
      <img
        v-else-if="currentCoverUrl"
        class="h-full w-full object-cover"
        :src="currentCoverUrl"
        alt=""
      />
      <div v-else class="text-muted-foreground flex h-full w-full items-center justify-center">
        <ImagePlus class="h-8 w-8" />
      </div>
    </div>

    <label
      class="group hover:border-primary hover:bg-accent/50 flex cursor-pointer flex-col items-stretch gap-3 rounded-md border border-dashed p-4 transition-colors"
      :class="[
        props['aria-invalid'] ? 'border-destructive' : undefined,
        isDragging ? 'border-primary bg-accent/60' : undefined,
      ]"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        :key="inputKey"
        class="sr-only"
        :aria-invalid="props['aria-invalid']"
        :name="props.name"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @blur="emit('blur', $event)"
        @change="handleChange"
      />
      <div class="grid gap-2">
        <div class="flex items-center gap-2 text-sm font-medium">
          <Upload class="h-4 w-4" />
          点击选择或拖拽图片
        </div>
        <p class="text-muted-foreground text-sm">支持 JPG、PNG、WebP，选择后可直接缩放裁剪。</p>
        <Button
          v-if="sourceUrl"
          class="w-fit"
          size="sm"
          variant="outline"
          type="button"
          @click.prevent="reset"
        >
          <X />
          移除新封面
        </Button>
      </div>
    </label>
  </div>
</template>
