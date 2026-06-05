<script setup lang="ts">
import { Field, FieldDescription, FieldError, FieldLabel } from '@web/ui/components/ui/field';
import type { FieldVariants } from '@web/ui/components/ui/field';
import { Field as VeeField, type FieldSlotProps } from 'vee-validate';
import type { HTMLAttributes } from 'vue';
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

defineSlots<{
  default?: (
    props: FieldSlotProps<any> & {
      invalid: boolean;
      componentField: FieldSlotProps<any>['componentField'] & {
        'aria-invalid': boolean;
      };
    },
  ) => unknown;
}>();

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    description?: string;
    label?: string;
    labelClass?: HTMLAttributes['class'];
    name: string;
    orientation?: FieldVariants['orientation'];
    required?: boolean;
  }>(),
  {
    orientation: 'vertical',
    required: false,
  },
);

const attrs = useAttrs();

function hasError(props: { errors: any[] }) {
  return props.errors.length > 0;
}
</script>

<template>
  <VeeField v-slot="slotProps" :name="name" v-bind="attrs">
    <Field :class="props.class" :orientation="orientation" :data-invalid="hasError(slotProps)">
      <FieldLabel v-if="label" :class="labelClass" :required="required">
        {{ label }}
      </FieldLabel>

      <slot
        v-bind="{
          ...slotProps,
          invalid: hasError(slotProps),
          componentField: {
            ...slotProps.componentField,
            'aria-invalid': hasError(slotProps),
          },
        }"
      />

      <FieldDescription v-if="description" class="text-xs">
        {{ description }}
      </FieldDescription>

      <FieldError :errors="slotProps.errors" />
    </Field>
  </VeeField>
</template>
