const appHomePath = '/app/users';
const loginPath = '/login';

export default defineNuxtRouteMiddleware(async to => {
  const isAppRoute = to.path === '/app' || to.path.startsWith('/app/');
  const isLoginRoute = to.path === loginPath;

  if (!isAppRoute && !isLoginRoute) {
    return;
  }

  const { isAuthenticated } = useAuthState();

  if (isAppRoute && !isAuthenticated.value) {
    return navigateTo({
      path: loginPath,
      query: {
        redirect: to.fullPath,
      },
    });
  }

  if (isLoginRoute && isAuthenticated.value) {
    return navigateTo(appHomePath);
  }
});
