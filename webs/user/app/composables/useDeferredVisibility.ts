import type { MaybeRefOrGetter } from 'vue';

export interface UseDeferredVisibilityOptions {
  /** How long the source must stay active before it becomes visible, in ms. */
  delay?: number;
  /** How long it stays visible once shown, in ms. */
  minDuration?: number;
}

/**
 * Keeps loading placeholders from flashing: the result only turns visible when
 * the source stays active for `delay`, and once visible it stays visible for at
 * least `minDuration` even if the source goes inactive sooner.
 */
export function useDeferredVisibility(
  source: MaybeRefOrGetter<boolean>,
  options: UseDeferredVisibilityOptions = {},
) {
  const delay = options.delay ?? 180;
  const minDuration = options.minDuration ?? 320;

  const isVisible = ref(false);
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let shownAt = 0;

  function clearTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  }

  watch(
    () => toValue(source),
    isLoading => {
      clearTimers();

      if (isLoading) {
        if (isVisible.value) {
          return;
        }

        showTimer = setTimeout(() => {
          isVisible.value = true;
          shownAt = Date.now();
        }, delay);

        return;
      }

      if (!isVisible.value) {
        return;
      }

      const remaining = Math.max(minDuration - (Date.now() - shownAt), 0);

      hideTimer = setTimeout(() => {
        isVisible.value = false;
      }, remaining);
    },
    { immediate: true },
  );

  onBeforeUnmount(clearTimers);

  return isVisible;
}
