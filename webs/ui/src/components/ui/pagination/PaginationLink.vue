<script setup lang="ts">
import type { ButtonVariants } from '@web/ui/components/ui/button';
import { buttonVariants } from '@web/ui/components/ui/button';
import { cn } from '@web/ui/lib/utils';
import type { HTMLAttributes } from 'vue';

const props = withDefaults(
  defineProps<{
    href?: string;
    size?: ButtonVariants['size'];
    isActive?: boolean;
    class?: HTMLAttributes['class'];
  }>(),
  {
    size: 'icon',
    isActive: false,
  },
);
</script>

<template>
  <a
    :href="href"
    data-slot="pagination-link"
    :data-active="isActive ? '' : undefined"
    :aria-current="isActive ? 'page' : undefined"
    :class="
      cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        '',
        props.class,
      )
    "
  >
    <slot />
  </a>
</template>
