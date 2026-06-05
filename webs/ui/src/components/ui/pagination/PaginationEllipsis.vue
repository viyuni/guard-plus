<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { cn } from '@web/ui/lib/utils';
import { MoreHorizontalIcon } from 'lucide-vue-next';
import type { PaginationEllipsisProps } from 'reka-ui';
import { PaginationEllipsis } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<PaginationEllipsisProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <PaginationEllipsis
    data-slot="pagination-ellipsis"
    v-bind="delegatedProps"
    :class="
      cn('flex size-9 items-center justify-center [&_svg:not([class*=size-])]:size-4', props.class)
    "
  >
    <slot>
      <MoreHorizontalIcon />
      <span class="sr-only">More pages</span>
    </slot>
  </PaginationEllipsis>
</template>
