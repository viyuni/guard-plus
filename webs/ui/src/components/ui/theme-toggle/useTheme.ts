import { useDark } from '@vueuse/core';
export const useTheme = () => {
  const isDark = useDark({
    storageKey: 'theme',
    valueDark: 'dark',
    valueLight: 'light',
  });

  return {
    isDark,
  };
};
