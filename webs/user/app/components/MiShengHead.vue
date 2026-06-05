<script setup lang="ts">
import headBlinkUrl from '~/assets/misheng-head-blink.png';
import headUrl from '~/assets/misheng-head.png';

const isBlinking = ref(false);
const isShaking = ref(false);
let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
let blinkInterval: ReturnType<typeof setInterval> | undefined;
let shakeTimeout: ReturnType<typeof setTimeout> | undefined;

function blink() {
  isBlinking.value = true;
  blinkTimeout = setTimeout(() => {
    isBlinking.value = false;
  }, 140);
}

function shake() {
  if (shakeTimeout) {
    clearTimeout(shakeTimeout);
  }

  isShaking.value = false;

  requestAnimationFrame(() => {
    isShaking.value = true;
    shakeTimeout = setTimeout(() => {
      isShaking.value = false;
    }, 520);
  });
}

onMounted(() => {
  blinkInterval = setInterval(blink, 2800);
});

onBeforeUnmount(() => {
  if (blinkTimeout) {
    clearTimeout(blinkTimeout);
  }

  if (blinkInterval) {
    clearInterval(blinkInterval);
  }

  if (shakeTimeout) {
    clearTimeout(shakeTimeout);
  }
});
</script>

<template>
  <img
    :src="isBlinking ? headBlinkUrl : headUrl"
    alt="MiSheng Shop"
    :class="{ 'misheng-head-shake': isShaking }"
    class="select-none"
    draggable="false"
    @click="shake"
  />
</template>

<style scoped>
.misheng-head-shake {
  animation: misheng-head-shake 520ms ease-in-out;
  transform-origin: 50% 85%;
}

@keyframes misheng-head-shake {
  0%,
  100% {
    transform: rotate(0deg) translateX(0);
  }

  18% {
    transform: rotate(-9deg) translateX(-1px);
  }

  36% {
    transform: rotate(8deg) translateX(1px);
  }

  54% {
    transform: rotate(-6deg) translateX(-1px);
  }

  72% {
    transform: rotate(4deg) translateX(1px);
  }
}
</style>
