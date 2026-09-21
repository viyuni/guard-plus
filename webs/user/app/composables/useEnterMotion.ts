import { useReducedMotion } from 'motion-v';

/** Soft, decelerating curve used by every entrance animation. */
const ENTER_EASE = [0.22, 1, 0.36, 1] as const;

/** Shared entrance duration in seconds. */
const ENTER_DURATION = 0.3;

/** Seconds each staggered item waits for its predecessor. */
const STAGGER_STEP = 0.03;

/** Upper bound on stagger steps so long lists never wait on a late item. */
const MAX_STAGGER_STEPS = 10;

export interface UseEnterMotionOptions {
  /** Vertical travel in pixels. Defaults to `16`. */
  offset?: number;
  /** Position in the staggered sequence. Defaults to `0`. */
  index?: number;
  /** Seconds between staggered items. Defaults to `0.03`. */
  stagger?: number;
}

/**
 * Builds the `initial` / `animate` / `exit` / `transition` props for a
 * content entrance, honouring the user's reduced motion preference.
 */
export function useEnterMotion(options: UseEnterMotionOptions = {}) {
  const prefersReducedMotion = useReducedMotion();
  const offset = options.offset ?? 16;
  const stagger = options.stagger ?? STAGGER_STEP;
  const delay = Math.min(Math.max(options.index ?? 0, 0), MAX_STAGGER_STEPS) * stagger;

  const initial = computed(() => ({
    opacity: 0,
    y: prefersReducedMotion.value ? 0 : offset,
  }));

  const animate = computed(() => ({ opacity: 1, y: 0 }));

  const exit = computed(() => initial.value);

  const transition = computed(() =>
    prefersReducedMotion.value
      ? { duration: 0 }
      : { delay, duration: ENTER_DURATION, ease: ENTER_EASE },
  );

  return { animate, exit, initial, transition };
}
