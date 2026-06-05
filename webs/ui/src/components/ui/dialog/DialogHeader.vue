<script setup lang="ts">
import { cn } from '@web/ui/lib/utils';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div data-slot="dialog-header" :class="cn('flex flex-col gap-2', props.class)">
    <slot />
  </div>
</template>
