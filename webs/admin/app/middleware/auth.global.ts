import { useAuthStore } from '~/features/auth/store';

const appHomePath = '/app/users';
const loginPath = '/login';

export default defineNuxtRouteMiddleware(to => {
  const authStore = useAuthStore();
  authStore.clearExpiredSession();

  const isAuthenticated = authStore.isAuthenticated;
  const isAppRoute = to.path === '/app' || to.path.startsWith('/app/');

  if (isAppRoute && !isAuthenticated) {
    return navigateTo({
      path: loginPath,
      query: {
        redirect: to.fullPath,
      },
    });
  }

  if (to.path === loginPath && isAuthenticated) {
    return navigateTo(appHomePath);
  }
});
