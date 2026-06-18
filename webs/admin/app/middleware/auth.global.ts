import { useAdminSession } from '~/features/auth';

const appHomePath = '/app/users';
const loginPath = '/login';

export default defineNuxtRouteMiddleware(async to => {
  const isAppRoute = to.path === '/app' || to.path.startsWith('/app/');
  const isLoginRoute = to.path === loginPath;

  if (!isAppRoute && !isLoginRoute) {
    return;
  }

  const { authenticated, refetch } = useAdminSession();
  await refetch();

  if (isAppRoute && !authenticated.value) {
    return navigateTo({
      path: loginPath,
      query: {
        redirect: to.fullPath,
      },
    });
  }

  if (isLoginRoute && authenticated.value) {
    return navigateTo(appHomePath);
  }
});
