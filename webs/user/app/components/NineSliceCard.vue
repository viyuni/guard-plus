<script setup lang="ts">
import { computed } from 'vue';

type Props = {
  /**
   * 内容内边距，单位 px
   */
  padding?: number;

  /**
   * 描边宽度，单位 px
   */
  strokeWidth?: number;

  /**
   * 填充色
   */
  fill?: string;

  /**
   * 是否强制正方形
   */
  square?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  padding: 0,
  strokeWidth: 1,
  fill: '#fff',
  square: false,
});

const cardStyle = computed(() => ({
  '--shape-padding': `${props.padding}px`,
  '--shape-stroke-width': `${props.strokeWidth}px`,
  '--shape-fill': props.fill,
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
  position: relative;
  box-sizing: border-box;

  width: 100%;
  min-width: calc(var(--shape-stroke-width) * 2);
  min-height: calc(var(--shape-stroke-width) * 2);

  padding: var(--shape-stroke-width);

  /*
    关键：
    描边颜色跟随当前字体颜色
  */
  background-color: currentColor;

  mask-image: url('~/assets/masks/shape-card-mask.svg');
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  mask-position: center;

  -webkit-mask-image: url('~/assets/masks/shape-card-mask.svg');
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.shape-card--square {
  aspect-ratio: 1 / 1;
}

.shape-card__inner {
  box-sizing: border-box;
  width: 100%;
  height: 100%;

  padding: var(--shape-padding);

  background: var(--shape-fill);

  mask-image: url('~/assets/masks/shape-card-mask.svg');
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  mask-position: center;

  -webkit-mask-image: url('~/assets/masks/shape-card-mask.svg');
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}
</style>
