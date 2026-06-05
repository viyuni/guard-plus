<script setup lang="ts">
import { useLogin } from '~/features/auth/mutations';

const { mutate: login } = useLogin();
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
    <div class="absolute top-4 right-4">
      <ThemeToggle />
    </div>

    <div class="flex w-full max-w-sm flex-col gap-6">
      <a
        href="https://viyuni.top"
        target="_blank"
        class="flex items-center gap-1 self-center font-medium uppercase"
      >
        <AppLogo />
      </a>
      <LoginForm @submit="data => login(data)" />
    </div>

    <FluidCursor class="-z-1 opacity-50" />
  </div>
</template>
