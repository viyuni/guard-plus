import { useQueryCache } from '@pinia/colada';

import { USER_SESSION_QUERY_KEYS } from '~/features/account/queries';

export function useUserSessionSync() {
  const queryCache = useQueryCache();
  const { refreshUserSession } = useUserSession();
  const { clearAuthState, setAuthenticatedState } = useAuthState();

  async function refreshSyncedSession() {
    await queryCache.invalidateQueries({ key: USER_SESSION_QUERY_KEYS.session() });
    await refreshUserSession();
  }

  async function syncAuthenticatedSession() {
    setAuthenticatedState();
    await refreshSyncedSession();
  }

  async function syncUnauthenticatedSession() {
    clearAuthState();
    await refreshSyncedSession();
  }

  return {
    refreshSyncedSession,
    syncAuthenticatedSession,
    syncUnauthenticatedSession,
  };
}
