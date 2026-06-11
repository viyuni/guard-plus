<template>
  <div class="h-svh overflow-y-auto">
    <DocsHeader />

    <div class="mx-auto min-h-[calc(100%-var(--header-height))] max-w-(--breakpoint-2xl) border-x">
      <main class="p-5 pb-10 lg:p-10 lg:pb-16">
        <slot />
      </main>
    </div>

    <FluidCursor class="pointer-events-none fixed inset-0 z-[-1] opacity-20" />
  </div>
</template>
