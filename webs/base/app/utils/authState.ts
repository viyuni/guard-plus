export const AUTH_STATE_COOKIE_NAME = 'authState';
export const AUTH_STATE_COOKIE_VALUE = 'authenticated';

export function useAuthState() {
  const authState = useCookie(AUTH_STATE_COOKIE_NAME);

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
