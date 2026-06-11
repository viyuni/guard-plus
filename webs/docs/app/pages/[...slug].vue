<script setup lang="ts">
const route = useRoute();
const { locale } = useI18n();

const slug = computed(() => {
  const raw = Array.isArray(route.params.slug)
    ? String(route.params.slug.join('/'))
    : String(route.params.slug ?? '');
  return raw ? '/' + raw : '/';
});

const { data: page } = await useAsyncData(
  'page-' + locale.value + '-' + slug.value,
  async () => {
    const [enContent, zhContent] = await Promise.all([
      queryCollection('content_en').path(slug.value).first(),
      locale.value === 'zh'
        ? queryCollection('content_zh').path(slug.value).first()
        : Promise.resolve(null),
    ]);

    return (locale.value === 'zh' ? zhContent : null) ?? enContent ?? null;
  },
  {
    watch: [locale],
  },
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

useSeoMeta(page.value.seo);
</script>

<template>
  <DocsLayout>
    <ContentRenderer v-if="page" :value="page" class="markdown" />
  </DocsLayout>
</template>
