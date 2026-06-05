<script setup lang="ts">
import { computed } from 'vue';

type Props = {
  /**
   * 九宫格切片尺寸，单位 px
   */
  slice?: number;

  /**
   * 描边宽度，单位 px
   */
  strokeWidth?: number;

  /**
   * 内容内边距，单位 px
   */
  padding?: number;

  /**
   * 是否强制正方形
   */
  square?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  slice: 1,
  strokeWidth: 0.8,
  padding: 8,
  square: false,
});

const cardStyle = computed(() => ({
  '--shape-slice': props.slice,
  '--shape-border': `${props.slice}px`,
  '--shape-stroke-width': `${props.strokeWidth}px`,
  '--shape-padding': `${props.padding}px`,
}));
</script>

<template>
  <div class="shape-card" :class="{ 'shape-card--square': square }" :style="cardStyle">
    <div class="shape-card__inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.shape-card {
  box-sizing: border-box;
  width: 100%;

  padding: var(--shape-stroke-width);

  border: var(--shape-border) solid transparent;
  border-image-source: url('~/assets/masks/shape-card-stroke.svg');
  border-image-slice: var(--shape-slice) fill;
  border-image-width: var(--shape-border);
  border-image-repeat: stretch;
}

.shape-card--square {
  aspect-ratio: 1 / 1;
}

.shape-card__inner {
  box-sizing: border-box;

  width: 100%;
  height: 100%;

  padding: var(--shape-padding);

  border: var(--shape-border) solid transparent;
  border-image-source: url('~/assets/masks/shape-card-fill.svg');
  border-image-slice: var(--shape-slice) fill;
  border-image-width: var(--shape-border);
  border-image-repeat: stretch;
}
</style>
