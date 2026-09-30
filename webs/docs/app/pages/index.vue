<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();

const quickStart = ['vp install', 'vpr docs#dev --port 3002'].join('\n');

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
              <li>{{ $t('home.stackNuxt') }}</li>
              <li>{{ $t('home.stackVue') }}</li>
              <li>{{ $t('home.stackStyles') }}</li>
              <li>{{ $t('home.stackState') }}</li>
              <li>{{ $t('home.stackForms') }}</li>
            </ul>
          </DocsCard>
          <DocsCard :title="$t('home.backend')" icon="Server">
            <ul class="space-y-1">
              <li>{{ $t('home.stackHttp') }}</li>
              <li>{{ $t('home.stackDatabase') }}</li>
              <li>{{ $t('home.stackJobs') }}</li>
              <li>{{ $t('home.stackRuntime') }}</li>
              <li>{{ $t('home.stackTypes') }}</li>
            </ul>
          </DocsCard>
          <DocsCard :title="$t('home.tooling')" icon="Wrench">
            <ul class="space-y-1">
              <li>{{ $t('home.stackTypeScript') }}</li>
              <li>{{ $t('home.stackToolchain') }}</li>
              <li>{{ $t('home.stackValidation') }}</li>
              <li>{{ $t('home.stackDocker') }}</li>
              <li>{{ $t('home.stackCi') }}</li>
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
          <DocsCode language="bash" label="Terminal" :code="quickStart" />
          <p class="mt-6 text-center">
            <NuxtLink :to="localePath('/about')" class="text-primary underline underline-offset-4">
              {{ $t('home.developmentGuide') }}
            </NuxtLink>
          </p>
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
