<script setup lang="ts">
import { BiliGuardType } from '@shared/schema/reward';

const guardTypeOptions = [
  { label: '总督', value: BiliGuardType.Zongdu },
  { label: '提督', value: BiliGuardType.Tidu },
  { label: '舰长', value: BiliGuardType.Jianzhang },
] as const;

const model = defineModel<BiliGuardType[] | undefined>();

const selected = computed(() => new Set(model.value ?? []));

function updateSelectedGuardTypes(guardType: BiliGuardType, state: boolean) {
  const next = new Set(model.value ?? []);

  if (state) {
    next.add(guardType);
  } else {
    next.delete(guardType);
  }

  model.value = [...next];
}
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <Label
      v-for="option in guardTypeOptions"
      :key="option.value"
      class="flex items-center gap-2 text-sm"
    >
      <Checkbox
        :model-value="selected.has(option.value)"
        @update:model-value="updateSelectedGuardTypes(option.value, Boolean($event))"
      />
      {{ option.label }}
    </Label>
  </div>
</template>
