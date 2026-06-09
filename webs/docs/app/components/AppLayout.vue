<template>
  <div class="h-svh overflow-y-auto">
    <header
      class="bg-background/80 sticky top-0 z-50 h-(--header-height) w-full border-b backdrop-blur-lg"
    >
      <div class="container mx-auto flex h-full items-center justify-between border-x px-5">
        <AppLogo class="-mt-1" />
        <ThemeToggle />
      </div>
    </header>

    <main class="container mx-auto min-h-[calc(100%-var(--header-height))] border-x p-5 pb-10">
      <slot />
    </main>

    <FluidCursor class="z-[-1] opacity-30" />
  </div>
</template>
