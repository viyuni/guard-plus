<script setup lang="ts">
import { Leafer, Image as LeaferImage } from 'leafer-ui';
import { Minus, Plus, RotateCcw } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

import { Button } from '../button';

export interface ImageCropperResult {
  blob: Blob;
  dataUrl: string;
  height: number;
  width: number;
}

export interface ImageCropperState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

const props = withDefaults(
  defineProps<{
    src: string;
    maxScale?: number;
    mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
    outputSize?: number;
    previewSize?: number;
    quality?: number;
  }>(),
  {
    maxScale: 5,
    mimeType: 'image/png',
    outputSize: 512,
    previewSize: 320,
    quality: 0.92,
  },
);

const emit = defineEmits<{
  change: [state: ImageCropperState];
}>();

const viewRef = ref<HTMLDivElement>();
const app = shallowRef<Leafer>();
const imageNode = shallowRef<LeaferImage>();
const sourceImage = shallowRef<HTMLImageElement>();
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const mounted = ref(false);
let loadVersion = 0;
const offsetX = ref(0);
const offsetY = ref(0);
const scale = ref(1);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
const viewportSize = ref(props.previewSize);
let resizeObserver: ResizeObserver | undefined;

const minScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) {
    return 1;
  }

  return Math.max(
    viewportSize.value / naturalWidth.value,
    viewportSize.value / naturalHeight.value,
  );
});

const fittedWidth = computed(() => naturalWidth.value * minScale.value * scale.value);
const fittedHeight = computed(() => naturalHeight.value * minScale.value * scale.value);

const cropState = computed<ImageCropperState>(() => ({
  offsetX: offsetX.value,
  offsetY: offsetY.value,
  scale: scale.value,
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampOffset(value: number, fittedSize: number) {
  if (fittedSize <= viewportSize.value) {
    return (viewportSize.value - fittedSize) / 2;
  }

  return clamp(value, viewportSize.value - fittedSize, 0);
}

function clampTransform() {
  scale.value = clamp(scale.value, 1, props.maxScale);
  offsetX.value = clampOffset(offsetX.value, fittedWidth.value);
  offsetY.value = clampOffset(offsetY.value, fittedHeight.value);
}

function syncImageNode() {
  const node = imageNode.value;

  if (!node) {
    return;
  }

  clampTransform();
  node.set({
    height: fittedHeight.value,
    width: fittedWidth.value,
    x: offsetX.value,
    y: offsetY.value,
  });
  emit('change', cropState.value);
}

function resizeAppToView() {
  const rect = viewRef.value?.getBoundingClientRect();
  const size = rect?.width || props.previewSize;

  viewportSize.value = size;
  app.value?.resize({ height: size, width: size });
  syncImageNode();
}

function reset() {
  scale.value = 1;
  offsetX.value = (viewportSize.value - fittedWidth.value) / 2;
  offsetY.value = (viewportSize.value - fittedHeight.value) / 2;
  syncImageNode();
}

function zoomBy(delta: number, originX = viewportSize.value / 2, originY = viewportSize.value / 2) {
  zoomTo(scale.value + delta, originX, originY);
}

function zoomTo(
  nextValue: number,
  originX = viewportSize.value / 2,
  originY = viewportSize.value / 2,
) {
  const previousScale = scale.value;
  const nextScale = clamp(nextValue, 1, props.maxScale);

  if (nextScale === previousScale) {
    return;
  }

  const ratio = nextScale / previousScale;
  offsetX.value = originX - (originX - offsetX.value) * ratio;
  offsetY.value = originY - (originY - offsetY.value) * ratio;
  scale.value = nextScale;
  syncImageNode();
}

function handleScaleInput(event: Event) {
  const input = event.target as HTMLInputElement;

  zoomTo(Number(input.value));
}

function loadSourceImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();

    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });
}

async function setSource(src: string) {
  const version = ++loadVersion;

  if (!src) {
    sourceImage.value = undefined;
    naturalWidth.value = 0;
    naturalHeight.value = 0;
    imageNode.value?.remove();
    imageNode.value = undefined;
    return;
  }

  const image = await loadSourceImage(src);

  if (version !== loadVersion) {
    return;
  }

  sourceImage.value = image;
  naturalWidth.value = image.naturalWidth;
  naturalHeight.value = image.naturalHeight;

  if (!imageNode.value) {
    imageNode.value = new LeaferImage({ draggable: false, url: src });
    app.value?.add(imageNode.value);
  } else {
    imageNode.value.url = src;
  }

  await nextTick();
  reset();
}

function getLocalPoint(event: PointerEvent | WheelEvent) {
  const rect = viewRef.value?.getBoundingClientRect();

  if (!rect) {
    return { x: viewportSize.value / 2, y: viewportSize.value / 2 };
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function handlePointerDown(event: PointerEvent) {
  if (!sourceImage.value) {
    return;
  }

  isDragging.value = true;
  viewRef.value?.setPointerCapture(event.pointerId);
  dragStart.value = {
    offsetX: offsetX.value,
    offsetY: offsetY.value,
    x: event.clientX,
    y: event.clientY,
  };
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value) {
    return;
  }

  const rect = viewRef.value?.getBoundingClientRect();
  const ratio = rect ? viewportSize.value / rect.width : 1;

  offsetX.value = dragStart.value.offsetX + (event.clientX - dragStart.value.x) * ratio;
  offsetY.value = dragStart.value.offsetY + (event.clientY - dragStart.value.y) * ratio;
  syncImageNode();
}

function handlePointerUp(event: PointerEvent) {
  isDragging.value = false;
  viewRef.value?.releasePointerCapture(event.pointerId);
}

function handleWheel(event: WheelEvent) {
  if (!sourceImage.value) {
    return;
  }

  event.preventDefault();
  const point = getLocalPoint(event);
  zoomBy(event.deltaY > 0 ? -0.12 : 0.12, point.x, point.y);
}

function exportDataUrl() {
  if (!sourceImage.value) {
    throw new Error('请先选择图片');
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('当前浏览器不支持图片导出');
  }

  const drawScale = props.outputSize / viewportSize.value;

  canvas.width = props.outputSize;
  canvas.height = props.outputSize;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    sourceImage.value,
    offsetX.value * drawScale,
    offsetY.value * drawScale,
    fittedWidth.value * drawScale,
    fittedHeight.value * drawScale,
  );

  return canvas.toDataURL(props.mimeType, props.quality);
}

async function exportBlob() {
  const dataUrl = exportDataUrl();
  const response = await fetch(dataUrl);

  return await response.blob();
}

async function exportImage(): Promise<ImageCropperResult> {
  const dataUrl = exportDataUrl();
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return {
    blob,
    dataUrl,
    height: props.outputSize,
    width: props.outputSize,
  };
}

watch(
  () => props.src,
  src => {
    if (mounted.value) {
      void setSource(src);
    }
  },
);

watch(
  () => props.previewSize,
  () => {
    resizeAppToView();
    reset();
  },
);

onMounted(() => {
  if (!viewRef.value) {
    return;
  }

  mounted.value = true;
  app.value = new Leafer({
    height: viewRef.value.clientWidth || props.previewSize,
    view: viewRef.value,
    width: viewRef.value.clientWidth || props.previewSize,
  });
  resizeObserver = new ResizeObserver(resizeAppToView);
  resizeObserver.observe(viewRef.value);

  void setSource(props.src);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  app.value?.destroy();
});

defineExpose({
  exportBlob,
  exportDataUrl,
  exportImage,
  reset,
});
</script>

<template>
  <div class="grid w-full gap-3">
    <div
      ref="viewRef"
      class="bg-muted relative aspect-square w-full touch-none overflow-hidden rounded-md border"
      :class="{ 'cursor-grabbing': isDragging, 'cursor-grab': !isDragging }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel="handleWheel"
    >
      <div class="pointer-events-none absolute inset-0 ring-1 ring-white/70 ring-inset" />
    </div>

    <div class="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" type="button" @click="zoomBy(-0.12)">
        <Minus />
        <span class="sr-only">缩小</span>
      </Button>
      <input
        :value="scale"
        class="accent-primary min-w-0 flex-1"
        type="range"
        min="1"
        :max="maxScale"
        step="0.01"
        aria-label="缩放"
        @change.stop
        @input.stop="handleScaleInput"
      />
      <Button variant="outline" size="icon-sm" type="button" @click="zoomBy(0.12)">
        <Plus />
        <span class="sr-only">放大</span>
      </Button>
      <Button variant="ghost" size="icon-sm" type="button" @click="reset">
        <RotateCcw />
        <span class="sr-only">重置</span>
      </Button>
    </div>
  </div>
</template>
