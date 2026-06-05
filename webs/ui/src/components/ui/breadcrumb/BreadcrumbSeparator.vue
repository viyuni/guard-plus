<script lang="ts" setup>
import { cn } from '@web/ui/lib/utils';
import { ChevronRightIcon } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    :class="cn('[&>svg]:size-3.5', props.class)"
  >
    <slot>
      <ChevronRightIcon class="cn-rtl-flip" />
    </slot>
  </li>
</template>
