<script setup lang="ts">
import { BookOpen, Rocket, FileText, Menu, X } from 'lucide-vue-next';

const route = useRoute();
const { locale, locales, setLocale, t } = useI18n();
const localePath = useLocalePath();
const config = useRuntimeConfig();

const mobileOpen = ref(false);

const navItems = computed(() => [
  { label: t('nav.about'), to: localePath('/about'), icon: BookOpen },
  { label: t('nav.changelog'), to: localePath('/changelog'), icon: FileText },
  { label: t('nav.deploy'), to: localePath('/deploy'), icon: Rocket },
]);

function isActive(to: string) {
  return route.path === to;
}

const availableLocales = computed(() => locales.value as { code: string; name: string }[]);

function onLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  setLocale(target.value as 'en' | 'zh');
}

watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  },
);
</script>

<template>
  <header
    class="bg-background/75 sticky top-0 z-50 h-(--header-height) w-full border-b backdrop-blur-md"
  >
    <div
      class="mx-auto flex h-full max-w-(--breakpoint-2xl) items-center justify-between border-x px-5"
    >
      <div class="flex items-center gap-3">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5">
          <AppLogo :width="120" />
        </NuxtLink>
      </div>

      <!-- Desktop nav -->
      <div class="hidden items-center gap-5 sm:flex">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors',
            isActive(item.to)
              ? 'text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          ]"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </NuxtLink>
        <span class="text-muted-foreground hidden text-sm font-medium sm:inline-block">
          v{{ config.public.version }}
        </span>
        <select
          :value="locale"
          class="bg-background text-muted-foreground cursor-pointer rounded-md px-1 py-0.5 text-sm focus:outline-none"
          aria-label="Language"
          @change="onLocaleChange"
        >
          <option v-for="l in availableLocales" :key="l.code" :value="l.code">
            {{ l.name }}
          </option>
        </select>
        <div class="flex items-center gap-2">
          <a
            href="https://github.com/viyuni/guard-plus"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
            aria-label="GitHub"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
              />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>

      <!-- Mobile hamburger -->
      <div class="flex items-center gap-2 sm:hidden">
        <select
          :value="locale"
          class="bg-background/75 text-muted-foreground cursor-pointer rounded-md px-1 py-0.5 text-sm backdrop-blur-md focus:outline-none"
          aria-label="Language"
          @change="onLocaleChange"
        >
          <option v-for="l in availableLocales" :key="l.code" :value="l.code">
            {{ l.name }}
          </option>
        </select>
        <ThemeToggle />
        <button
          class="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
          aria-label="Toggle menu"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" class="size-5" />
          <Menu v-else class="size-5" />
        </button>
      </div>
    </div>

    <!-- Mobile menu panel -->
    <div v-if="mobileOpen" class="bg-background/75 border-b backdrop-blur-md sm:hidden">
      <nav class="flex flex-col gap-1 px-5 pt-2 pb-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive(item.to)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          ]"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </NuxtLink>
        <a
          href="https://github.com/viyuni/guard-plus"
          target="_blank"
          rel="noopener noreferrer"
          class="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
          GitHub
        </a>
      </nav>
    </div>
  </header>
</template>
