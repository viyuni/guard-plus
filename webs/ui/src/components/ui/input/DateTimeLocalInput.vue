<script setup lang="ts">
import { computed, useAttrs, watchEffect } from 'vue';
import type { HTMLAttributes } from 'vue';

import Input from './Input.vue';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  class?: HTMLAttributes['class'];
  emptyAsNull?: boolean;
}>();

const model = defineModel<Date | string | undefined | null>();
const attrs = useAttrs();

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return isValidDate(date) ? date : null;
}

function toDatetimeLocalValue(value: Date | string | null | undefined) {
  const date = toDate(value);

  if (!date) return '';

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join('T');
}

function parseDatetimeLocalValue(value: string) {
  const date = new Date(value);

  return isValidDate(date) ? date : null;
}

function getEmptyValue() {
  return props.emptyAsNull ? null : undefined;
}

watchEffect(() => {
  if (typeof model.value !== 'string') return;

  model.value = toDate(model.value);
});

const value = computed({
  get() {
    return toDatetimeLocalValue(model.value);
  },

  set(value: string) {
    model.value = value ? parseDatetimeLocalValue(value) : getEmptyValue();
  },
});
</script>

<template>
  <Input v-bind="attrs" v-model="value" :class="props.class" type="datetime-local" />
</template>
