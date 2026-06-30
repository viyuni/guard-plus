import { UserLoginSchema, UserRegisterSchema } from '@shared/schema/user';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_VALUE,
  BILI_REGISTER_CODE_COOKIE_NAME,
  BILI_REGISTER_COOKIE_OPTIONS,
  BILI_REGISTER_VERIFIER_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  getAuthStateCookieOptions,
} from '#modules/auth';

import { userEnv } from '../../env';
import { AuthUseCase } from './usecase';
export * from './usecase';

const authStateCookieOptions = getAuthStateCookieOptions(
  userEnv.USER_API_ORIGIN,
  userEnv.USER_WEB_ORIGINS,
);

function getCookieString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function getBiliRegisterCredential(cookie: Record<string, { value: unknown } | undefined>) {
  const code = getCookieString(cookie[BILI_REGISTER_CODE_COOKIE_NAME]?.value);
  const verifier = getCookieString(cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]?.value);

  return code && verifier ? { code, verifier } : undefined;
}

function removeBiliRegisterCookies(cookie: Record<string, { remove: () => void } | undefined>) {
  cookie[BILI_REGISTER_CODE_COOKIE_NAME]?.remove();
  cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]?.remove();
}

export const auth = new Elysia({
  name: 'AuthRoute',
  prefix: '/auth',
  detail: {
    tags: ['Auth'],
  },
})
  .use(appContext)
  .derive(({ authUseCase, biliRegisterUseCase, rewardUseCase, userUseCase }) => ({
    userAuthUseCase: new AuthUseCase({
      authUseCase,
      biliRegisterUseCase,
      biliRoom: userEnv.BILI_ROOM,
      rewardUseCase,
      userUseCase,
    }),
  }))
  .post(
    '/login',
    async ({ body, cookie, userAuthUseCase }) => {
      const { user, accessToken, refreshToken } = await userAuthUseCase.login(body);

      cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
        ...ACCESS_TOKEN_COOKIE_OPTIONS,
        value: accessToken,
      });
      cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        value: refreshToken,
      });
      cookie[AUTH_STATE_COOKIE_NAME]!.set({
        ...authStateCookieOptions,
        value: AUTH_STATE_COOKIE_VALUE,
      });

      return user;
    },
    {
      body: UserLoginSchema,
      detail: {
        summary: '用户登录',
      },
    },
  )
  .post(
    '/logout',
    async ({ cookie, authUseCase }) => {
      const accessToken = cookie[ACCESS_TOKEN_COOKIE_NAME]?.value;

      if (accessToken && typeof accessToken === 'string') {
        await authUseCase.revokeByAccessToken(accessToken);
      }

      cookie[ACCESS_TOKEN_COOKIE_NAME]!.remove();
      cookie[REFRESH_TOKEN_COOKIE_NAME]!.remove();
      cookie[AUTH_STATE_COOKIE_NAME]!.set({
        ...authStateCookieOptions,
        maxAge: 0,
        value: '',
      });

      return {
        success: true,
      };
    },
    {
      detail: {
        summary: '用户退出登录',
      },
    },
  )
  .post(
    '/register',
    async ({ body, cookie, userAuthUseCase }) => {
      const user = await userAuthUseCase.register(body, getBiliRegisterCredential(cookie));

      removeBiliRegisterCookies(cookie);

      return user;
    },
    {
      body: UserRegisterSchema,
      detail: {
        summary: '用户注册',
      },
    },
  )
  .post(
    '/biliRegisterCode',
    async ({ cookie, userAuthUseCase }) => {
      const { verifier, ...result } = await userAuthUseCase.createBiliRegisterCode();

      cookie[BILI_REGISTER_CODE_COOKIE_NAME]!.set({
        ...BILI_REGISTER_COOKIE_OPTIONS,
        value: result.code,
      });
      cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]!.set({
        ...BILI_REGISTER_COOKIE_OPTIONS,
        value: verifier,
      });

      return result;
    },
    {
      detail: {
        summary: '生成直播间注册验证码',
      },
    },
  )
  .get(
    '/biliRegisterCode',
    ({ cookie, userAuthUseCase }) => {
      const credential = getBiliRegisterCredential(cookie);

      return userAuthUseCase.getBiliRegisterCodeStatus(credential?.code, credential?.verifier);
    },
    {
      detail: {
        summary: '查询直播间注册验证码状态',
      },
    },
  );
