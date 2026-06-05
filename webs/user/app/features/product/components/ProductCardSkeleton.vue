<script setup lang="ts">
import { Skeleton } from '@web/ui/components/ui/skeleton';
</script>

<template>
  <article class="group rounded-xl">
    <div
      class="aspect-square w-full overflow-hidden rounded-2xl transition-shadow duration-200 group-hover:shadow-xl"
    >
      <Skeleton class="size-full rounded-none" />
    </div>

    <div class="flex items-end gap-2 px-1.5 py-2">
      <div class="min-w-0 flex-1">
        <Skeleton class="h-5 w-3/4" />
        <Skeleton class="mt-1 h-7 w-1/2" />
      </div>

      <Skeleton class="size-9 shrink-0 rounded-full" />
    </div>
  </article>
</template>
