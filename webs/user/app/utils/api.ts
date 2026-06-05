import type { UserApi } from '~/plugins/api';

export const api = new Proxy({} as UserApi, {
  get(_target, prop, receiver) {
    const { $api } = useNuxtApp();
    return Reflect.get($api, prop, receiver);
  },
});
