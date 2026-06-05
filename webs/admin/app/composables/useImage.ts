import { computed } from 'vue';

export function useImage() {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  const imageBaseUrl = computed(() => apiBaseUrl.replace(/\/$/, ''));

  function getImageUrl(image: string) {
    return new URL(`/images/${image}`, imageBaseUrl.value).href;
  }

  return {
    getImageUrl,
  };
}
