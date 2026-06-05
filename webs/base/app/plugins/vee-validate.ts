import { configure } from 'vee-validate';

export default defineNuxtPlugin(() => {
  configure({
    validateOnBlur: false,
  });
});
