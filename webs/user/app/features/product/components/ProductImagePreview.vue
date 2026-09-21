<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion-v';

interface ImageBounds {
  height: number;
  left: number;
  top: number;
  width: number;
}

type DeviceOrientationEventConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'denied' | 'granted'>;
};

const props = defineProps<{
  alt: string;
  productId: string;
  reviewOverlaySrc: string;
  showReviewOverlay?: boolean;
  src: string;
}>();

const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef');
const closeButtonRef = useTemplateRef<HTMLButtonElement>('closeButtonRef');

const isOpen = ref(false);
const sourceBounds = ref<ImageBounds>({ height: 0, left: 0, top: 0, width: 0 });
const targetBounds = ref<ImageBounds>({ height: 0, left: 0, top: 0, width: 0 });
const spotlightPosition = ref({ x: 50, y: 50 });
const spotlightOpacity = ref(0);
const prefersReducedMotion = useReducedMotion();

const tiltX = useMotionValue(0);
const tiltY = useMotionValue(0);
const springTiltX = useSpring(tiltX, { damping: 24, stiffness: 240 });
const springTiltY = useSpring(tiltY, { damping: 24, stiffness: 240 });

const dialogId = computed(() => `product-image-preview-${props.productId}`);

const initialBounds = computed(() => ({
  borderRadius: '1rem',
  height: sourceBounds.value.height,
  left: sourceBounds.value.left,
  top: sourceBounds.value.top,
  width: sourceBounds.value.width,
}));

const centeredBounds = computed(() => ({
  borderRadius: '1.75rem',
  height: targetBounds.value.height,
  left: targetBounds.value.left,
  top: targetBounds.value.top,
  width: targetBounds.value.width,
}));

const positionTransition = computed(() =>
  prefersReducedMotion.value
    ? { duration: 0 }
    : { damping: 30, mass: 0.8, stiffness: 320, type: 'spring' as const },
);

const tiltStyle = {
  rotateX: springTiltX,
  rotateY: springTiltY,
  transformStyle: 'preserve-3d',
};

const spotlightStyle = computed(() => ({
  background: `radial-gradient(circle at ${spotlightPosition.value.x}% ${spotlightPosition.value.y}%, rgba(255, 255, 255, 0.48), transparent 68%)`,
  opacity: spotlightOpacity.value,
}));

let previousBodyOverflow = '';
let orientationBaseline: { beta: number; gamma: number } | undefined;
let hasOrientationPermission = false;

function readBounds(element: HTMLElement): ImageBounds {
  const bounds = element.getBoundingClientRect();

  return {
    height: bounds.height,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
  };
}

function updateTargetBounds() {
  const horizontalMargin = 32;
  const verticalMargin = 64;
  const maximumSize = 720;

  const size = Math.max(
    0,
    Math.min(
      window.innerWidth - horizontalMargin,
      window.innerHeight - verticalMargin,
      maximumSize,
    ),
  );

  targetBounds.value = {
    height: size,
    left: (window.innerWidth - size) / 2,
    top: (window.innerHeight - size) / 2,
    width: size,
  };
}

function resetTilt() {
  tiltX.set(0);
  tiltY.set(0);
  spotlightPosition.value = { x: 50, y: 50 };
  spotlightOpacity.value = 0;
}

function setTilt(x: number, y: number) {
  const maximumTilt = 10;
  const clampedX = Math.max(-maximumTilt, Math.min(maximumTilt, x));
  const clampedY = Math.max(-maximumTilt, Math.min(maximumTilt, y));

  tiltX.set(clampedX);
  tiltY.set(clampedY);
  spotlightPosition.value = {
    x: 50 + (clampedY / maximumTilt) * 28,
    y: 50 - (clampedX / maximumTilt) * 28,
  };
  spotlightOpacity.value = 0.72;
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') {
    return;
  }

  const element = event.currentTarget as HTMLElement;
  const bounds = element.getBoundingClientRect();
  const horizontalProgress = (event.clientX - bounds.left) / bounds.width - 0.5;
  const verticalProgress = (event.clientY - bounds.top) / bounds.height - 0.5;

  setTilt(-verticalProgress * 20, horizontalProgress * 20);
}

function handlePointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse') {
    spotlightOpacity.value = 0.72;
  }
}

function getScreenOrientationAngle() {
  const legacyWindow = window as Window & { orientation?: number };

  return screen.orientation?.angle ?? legacyWindow.orientation ?? 0;
}

function handleDeviceOrientation(event: DeviceOrientationEvent) {
  if (!isOpen.value || event.beta === null || event.gamma === null) {
    return;
  }

  orientationBaseline ??= { beta: event.beta, gamma: event.gamma };

  const betaDelta = event.beta - orientationBaseline.beta;
  const gammaDelta = event.gamma - orientationBaseline.gamma;
  const orientationAngle = ((getScreenOrientationAngle() % 360) + 360) % 360;

  if (orientationAngle === 90) {
    setTilt(gammaDelta * 0.6, betaDelta * 0.6);
    return;
  }

  if (orientationAngle === 180) {
    setTilt(betaDelta * 0.6, -gammaDelta * 0.6);
    return;
  }

  if (orientationAngle === 270) {
    setTilt(-gammaDelta * 0.6, -betaDelta * 0.6);
    return;
  }

  setTilt(-betaDelta * 0.6, gammaDelta * 0.6);
}

function startDeviceOrientation() {
  orientationBaseline = undefined;
  window.addEventListener('deviceorientation', handleDeviceOrientation);
}

function stopDeviceOrientation() {
  window.removeEventListener('deviceorientation', handleDeviceOrientation);
  orientationBaseline = undefined;
}

async function requestDeviceOrientation() {
  if (
    hasOrientationPermission ||
    !window.matchMedia('(pointer: coarse)').matches ||
    !('DeviceOrientationEvent' in window)
  ) {
    return;
  }

  const orientationEvent = DeviceOrientationEvent as DeviceOrientationEventConstructor;

  try {
    if (orientationEvent.requestPermission) {
      hasOrientationPermission = (await orientationEvent.requestPermission()) === 'granted';
    } else {
      hasOrientationPermission = true;
    }
  } catch {
    hasOrientationPermission = false;
  }

  if (hasOrientationPermission && isOpen.value) {
    startDeviceOrientation();
  }
}

function openPreview() {
  if (!triggerRef.value) {
    return;
  }

  sourceBounds.value = readBounds(triggerRef.value);
  updateTargetBounds();
  void requestDeviceOrientation();
  isOpen.value = true;
}

function closePreview() {
  if (triggerRef.value) {
    sourceBounds.value = readBounds(triggerRef.value);
  }

  isOpen.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePreview();
  }
}

watch(isOpen, async open => {
  if (open) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', updateTargetBounds);
    window.addEventListener('keydown', handleKeydown);

    if (hasOrientationPermission) {
      startDeviceOrientation();
    }

    await nextTick();
    closeButtonRef.value?.focus({ preventScroll: true });
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener('resize', updateTargetBounds);
  window.removeEventListener('keydown', handleKeydown);
  stopDeviceOrientation();
  resetTilt();
  triggerRef.value?.focus({ preventScroll: true });
});

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener('resize', updateTargetBounds);
  window.removeEventListener('keydown', handleKeydown);
  stopDeviceOrientation();
});
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    class="group/image relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl text-left transition-shadow duration-200 group-hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2"
    :aria-controls="dialogId"
    :aria-expanded="isOpen"
    aria-haspopup="dialog"
    :aria-label="`放大查看${alt}`"
    @click="openPreview"
  >
    <img
      class="pointer-events-none block size-full object-cover object-center transition-transform duration-300 select-none group-hover/image:scale-[1.02]"
      :src="src"
      :alt="alt"
      loading="lazy"
      draggable="false"
    />

    <div
      v-if="showReviewOverlay"
      class="pointer-events-none absolute inset-0 grid place-items-center bg-white/55 backdrop-blur-[1px]"
      aria-hidden="true"
    >
      <img
        class="block size-3/8 object-contain object-center select-none"
        :src="reviewOverlaySrc"
        alt=""
        loading="lazy"
        draggable="false"
      />
    </div>
  </button>

  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="isOpen"
        :id="dialogId"
        class="fixed inset-0 z-100 bg-black/72 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        :aria-label="`${alt}大图预览`"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: prefersReducedMotion ? 0 : 0.2 }"
        @click.self="closePreview"
      >
        <motion.div
          class="fixed"
          :initial="prefersReducedMotion ? centeredBounds : initialBounds"
          :animate="centeredBounds"
          :exit="prefersReducedMotion ? centeredBounds : initialBounds"
          :transition="positionTransition"
          style="perspective: 1000px"
        >
          <motion.div
            class="relative size-full overflow-hidden rounded-[inherit] bg-black/10 shadow-2xl"
            :style="tiltStyle"
            @pointermove="handlePointerMove"
            @pointerenter="handlePointerEnter"
            @pointerleave="resetTilt"
          >
            <img
              class="pointer-events-none block size-full object-cover object-center select-none"
              :src="src"
              :alt="alt"
              draggable="false"
            />

            <div
              v-if="showReviewOverlay"
              class="pointer-events-none absolute inset-0 grid place-items-center bg-white/55 backdrop-blur-[1px]"
              aria-hidden="true"
            >
              <img
                class="block size-3/8 object-contain object-center select-none"
                :src="reviewOverlaySrc"
                alt=""
                draggable="false"
              />
            </div>

            <div
              class="pointer-events-none absolute inset-0 transition-opacity duration-300"
              :style="spotlightStyle"
              aria-hidden="true"
            />
          </motion.div>
        </motion.div>

        <button
          ref="closeButtonRef"
          type="button"
          class="fixed top-4 right-4 grid size-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:top-6 md:right-6"
          aria-label="关闭图片预览"
          @click="closePreview"
        >
          <X :size="22" />
        </button>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
