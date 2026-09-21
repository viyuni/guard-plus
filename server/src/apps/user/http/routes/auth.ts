import {
  BiliRegisterVerificationSchema,
  UserLoginSchema,
  UserRegisterSchema,
  UserResetPasswordSchema,
} from '@shared/schema/user';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import UserAuthFeature from '#apps/user/features/auth';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_STATE_COOKIE_NAME,
  AUTH_STATE_COOKIE_VALUE,
  BILI_PASSWORD_RESET_CODE_COOKIE_NAME,
  BILI_PASSWORD_RESET_VERIFIER_COOKIE_NAME,
  BILI_REGISTER_CODE_COOKIE_NAME,
  BILI_REGISTER_VERIFIER_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '#infrastructure/http';
import Auth from '#modules/auth';

import { UserAuthCookies } from '../auth';

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

function getBiliPasswordResetCredential(cookie: Record<string, { value: unknown } | undefined>) {
  const code = getCookieString(cookie[BILI_PASSWORD_RESET_CODE_COOKIE_NAME]?.value);
  const verifier = getCookieString(cookie[BILI_PASSWORD_RESET_VERIFIER_COOKIE_NAME]?.value);

  return code && verifier ? { code, verifier } : undefined;
}

function removeBiliPasswordResetCookies(
  cookie: Record<string, { remove: () => void } | undefined>,
) {
  cookie[BILI_PASSWORD_RESET_CODE_COOKIE_NAME]?.remove();
  cookie[BILI_PASSWORD_RESET_VERIFIER_COOKIE_NAME]?.remove();
}

export const AuthRoutes = ripple(
  {
    AuthUseCase: Auth.AuthUseCase,
    UserAuthCookies,
    UserAuthUseCase: UserAuthFeature.UserAuthUseCase,
  },
  ({ AuthUseCase, UserAuthCookies, UserAuthUseCase }) =>
    new Elysia({
      name: 'UserAuthRoute',
      prefix: '/auth',
      detail: {
        tags: ['Auth'],
      },
    })
      .post(
        '/login',
        async ({ body, cookie }) => {
          const { user, accessToken, refreshToken } = await UserAuthUseCase.login(body);

          cookie[ACCESS_TOKEN_COOKIE_NAME]!.set({
            ...UserAuthCookies.accessToken,
            value: accessToken,
          });
          cookie[REFRESH_TOKEN_COOKIE_NAME]!.set({
            ...UserAuthCookies.refreshToken,
            value: refreshToken,
          });
          cookie[AUTH_STATE_COOKIE_NAME]!.set({
            ...UserAuthCookies.authState,
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
        async ({ cookie }) => {
          const accessToken = cookie[ACCESS_TOKEN_COOKIE_NAME]?.value;

          if (accessToken && typeof accessToken === 'string') {
            await AuthUseCase.revokeByAccessToken(accessToken);
          }

          cookie[ACCESS_TOKEN_COOKIE_NAME]!.remove();
          cookie[REFRESH_TOKEN_COOKIE_NAME]!.remove();
          cookie[AUTH_STATE_COOKIE_NAME]!.set({
            ...UserAuthCookies.authState,
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
        async ({ body, cookie, set }) => {
          set.headers['Cache-Control'] = 'private, no-store';

          const user = await UserAuthUseCase.register(body, getBiliRegisterCredential(cookie));

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
        async ({ body, cookie, set }) => {
          set.headers['Cache-Control'] = 'private, no-store';

          const { verifier, ...result } = await UserAuthUseCase.createBiliRegisterCode(
            body.biliUid,
          );

          cookie[BILI_REGISTER_CODE_COOKIE_NAME]!.set({
            ...UserAuthCookies.biliRegister,
            value: result.code,
          });
          cookie[BILI_REGISTER_VERIFIER_COOKIE_NAME]!.set({
            ...UserAuthCookies.biliRegister,
            value: verifier,
          });

          return result;
        },
        {
          body: BiliRegisterVerificationSchema,
          detail: {
            summary: '生成直播间注册验证码',
          },
        },
      )
      .get(
        '/biliRegisterCode',
        ({ cookie, query, set }) => {
          set.headers['Cache-Control'] = 'private, no-store';

          const credential = getBiliRegisterCredential(cookie);

          return UserAuthUseCase.getBiliRegisterCodeStatus(
            query.biliUid,
            credential?.code,
            credential?.verifier,
          );
        },
        {
          query: BiliRegisterVerificationSchema,
          detail: {
            summary: '查询直播间注册验证码状态',
          },
        },
      )
      .post(
        '/passwordResetCode',
        async ({ body, cookie, set }) => {
          set.headers['Cache-Control'] = 'private, no-store';

          const { verifier, ...result } = await UserAuthUseCase.createBiliPasswordResetCode(
            body.biliUid,
          );

          cookie[BILI_PASSWORD_RESET_CODE_COOKIE_NAME]!.set({
            ...UserAuthCookies.biliRegister,
            value: result.code,
          });
          cookie[BILI_PASSWORD_RESET_VERIFIER_COOKIE_NAME]!.set({
            ...UserAuthCookies.biliRegister,
            value: verifier,
          });

          return result;
        },
        {
          body: BiliRegisterVerificationSchema,
          detail: {
            summary: '生成直播间密码重置验证码',
          },
        },
      )
      .get(
        '/passwordResetCode',
        ({ cookie, query, set }) => {
          set.headers['Cache-Control'] = 'private, no-store';
          const credential = getBiliPasswordResetCredential(cookie);

          return UserAuthUseCase.getBiliPasswordResetCodeStatus(
            query.biliUid,
            credential?.code,
            credential?.verifier,
          );
        },
        {
          query: BiliRegisterVerificationSchema,
          detail: {
            summary: '查询直播间密码重置验证码状态',
          },
        },
      )
      .post(
        '/resetPassword',
        async ({ body, cookie, set }) => {
          set.headers['Cache-Control'] = 'private, no-store';

          await UserAuthUseCase.resetPassword(body, getBiliPasswordResetCredential(cookie));
          removeBiliPasswordResetCookies(cookie);

          return { success: true };
        },
        {
          body: UserResetPasswordSchema,
          detail: {
            summary: '重置用户密码',
          },
        },
      ),
  { debugName: 'AuthRoutes' },
);
