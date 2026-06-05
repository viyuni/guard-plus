<script setup lang="ts"></script>

<template>
  <div class="grid h-dvh w-full grid-rows-[auto_1fr] overflow-hidden">
    <div
      class="border-base-300 container mx-auto flex items-center justify-between border-x border-b p-5"
    >
      <div class="flex gap-2 select-none">
        <AppLogo />
      </div>
      <ThemeToggle />
    </div>
    <div class="border-base-300 container mx-auto border-x">
      <div class="flex size-full flex-col items-center justify-center gap-2 select-none">
        <AppIcon width="38" height="38" class="animate-[spin_2s_linear_infinite]" />
        <h1 class="text-4xl font-bold">Coming soon</h1>
      </div>
    </div>

    <FluidCursor class="z-[-1] opacity-50" />
  </div>
</template>

<style scoped></style>
