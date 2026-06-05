<script lang="ts" setup>
import { reactiveOmit } from '@vueuse/core';
import { buttonVariants } from '@web/ui/components/ui/button';
import { cn } from '@web/ui/lib/utils';
import { ChevronLeftIcon } from 'lucide-vue-next';
import type { RangeCalendarPrevProps } from 'reka-ui';
import { RangeCalendarPrev, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<RangeCalendarPrevProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RangeCalendarPrev
    data-slot="range-calendar-prev-button"
    :class="
      cn(
        buttonVariants({ variant: 'outline' }),
        'absolute left-1',
        'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot>
      <ChevronLeftIcon class="size-4" />
    </slot>
  </RangeCalendarPrev>
</template>
