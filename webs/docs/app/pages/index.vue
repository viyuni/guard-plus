<script setup lang="ts">
const { t } = useI18n();

useHead({
  title: t('meta.title'),
  meta: [
    {
      name: 'description',
      content: t('meta.description'),
    },
  ],
});
</script>

<template>
  <div class="h-svh overflow-y-auto">
    <DocsHeader />

    <!-- Hero -->
    <div class="mx-auto max-w-(--breakpoint-2xl) border-x">
      <div class="flex flex-col items-center px-5 py-16 text-center lg:py-24">
        <AppLogo :width="280" class="mb-5" />

        <p class="text-muted-foreground mt-2 text-lg font-medium">
          {{ $t('home.subtitle') }}
        </p>

        <p class="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          {{ $t('home.description') }}
        </p>

        <div class="mt-8">
          <DocsBadges />
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="mx-auto max-w-(--breakpoint-2xl) border-x">
      <div class="border-t px-5 py-16 lg:py-20">
        <h2 class="mb-8 text-center text-2xl font-bold tracking-tight lg:text-3xl">
          {{ $t('home.features') }}
        </h2>
        <div class="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          <DocsCard :title="$t('home.featureRewards')" icon="Gift">
            {{ $t('home.featureRewardsDesc') }}
          </DocsCard>
          <DocsCard :title="$t('home.featureAdmin')" icon="ShieldCheck">
            {{ $t('home.featureAdminDesc') }}
          </DocsCard>
          <DocsCard :title="$t('home.featureUser')" icon="Users">
            {{ $t('home.featureUserDesc') }}
          </DocsCard>
          <DocsCard :title="$t('home.featureEvent')" icon="Workflow">
            {{ $t('home.featureEventDesc') }}
          </DocsCard>
        </div>
      </div>
    </div>

    <!-- Tech Stack -->
    <div class="mx-auto max-w-(--breakpoint-2xl) border-x">
      <div class="border-t px-5 py-16 lg:py-20">
        <h2 class="mb-8 text-center text-2xl font-bold tracking-tight lg:text-3xl">
          {{ $t('home.techStack') }}
        </h2>
        <div class="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          <DocsCard :title="$t('home.frontend')" icon="Monitor">
            <ul class="space-y-1">
              <li><strong>Nuxt 4</strong> with SSR</li>
              <li><strong>Vue 3</strong> Composition API</li>
              <li><strong>Tailwind CSS</strong> / shadcn-vue</li>
              <li><strong>Pinia</strong> state management</li>
              <li><strong>TanStack</strong> tables &amp; forms</li>
            </ul>
          </DocsCard>
          <DocsCard :title="$t('home.backend')" icon="Server">
            <ul class="space-y-1">
              <li><strong>Elysia</strong> HTTP framework</li>
              <li><strong>Drizzle ORM</strong> + PostgreSQL</li>
              <li><strong>Redis</strong> for queues &amp; caching</li>
              <li><strong>Bun</strong> JavaScript runtime</li>
              <li><strong>Eden</strong> type-safe RPC</li>
            </ul>
          </DocsCard>
          <DocsCard :title="$t('home.tooling')" icon="Wrench">
            <ul class="space-y-1">
              <li><strong>TypeScript 6.x</strong> throughout</li>
              <li><strong>Vite+</strong> monorepo tooling</li>
              <li><strong>Valibot</strong> schema validation</li>
              <li><strong>Docker</strong> containerization</li>
              <li><strong>GitHub Actions</strong> CI/CD</li>
            </ul>
          </DocsCard>
        </div>
      </div>
    </div>

    <!-- Get Started -->
    <div class="mx-auto max-w-(--breakpoint-2xl) border-x">
      <div class="border-t px-5 py-16 lg:py-20">
        <h2 class="mb-8 text-center text-2xl font-bold tracking-tight lg:text-3xl">
          {{ $t('home.getStarted') }}
        </h2>
        <div class="mx-auto max-w-xl">
          <DocsCode language="bash" label="Terminal">
            # Install dependencies vp install # Run all checks vpr check # Start development servers
            vpr @web/admin#dev vpr @web/user#dev</DocsCode
          >
          <p class="mt-6 text-center">
            <a
              href="https://github.com/viyuni/guard-plus"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary font-medium underline underline-offset-4"
            >
              {{ $t('home.viewOnGithub') }}
            </a>
          </p>
        </div>
      </div>
    </div>

    <FluidCursor class="pointer-events-none fixed inset-0 z-[-1] opacity-20" />
  </div>
</template>
