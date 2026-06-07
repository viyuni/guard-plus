import { useNuxtApp } from '#app';
import type { AdminApi } from '~/plugins/api';

export const api = new Proxy({} as AdminApi, {
  get(_target, prop, receiver) {
    return Reflect.get(useNuxtApp().$api as AdminApi, prop, receiver);
  },
});
