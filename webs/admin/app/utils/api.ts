export const api = new Proxy({} as ReturnType<typeof useNuxtApp>['$api'], {
  get(_target, prop, receiver) {
    return Reflect.get(useNuxtApp().$api, prop, receiver);
  },
});
