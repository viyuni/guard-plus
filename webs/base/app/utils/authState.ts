export const AUTH_STATE_COOKIE_NAME = 'auth';
export const AUTH_STATE_COOKIE_VALUE = 1;

export function useAuthState() {
  const authState = useCookie<number | null>(AUTH_STATE_COOKIE_NAME);

  const isAuthenticated = computed(() => authState.value === AUTH_STATE_COOKIE_VALUE);

  function setAuthState() {
    authState.value = AUTH_STATE_COOKIE_VALUE;
  }

  function clearAuthState() {
    authState.value = null;
  }

  return {
    authState,
    clearAuthState,
    isAuthenticated,
    setAuthState,
  };
}
