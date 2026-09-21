import type { CookieOptions } from 'elysia';

/**
 * 鉴权 Cookie 的传输层配置。
 *
 * 名字与有效期由 App 组合根显式传入, 本模块不读取环境变量。
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const AUTH_STATE_COOKIE_NAME = 'auth';
export const AUTH_STATE_COOKIE_VALUE = '1';
export const AUTH_COOKIE_NAME = ACCESS_TOKEN_COOKIE_NAME;
export const BILI_REGISTER_CODE_COOKIE_NAME = 'biliRegisterCode';
export const BILI_REGISTER_VERIFIER_COOKIE_NAME = 'biliRegisterVerifier';
export const BILI_PASSWORD_RESET_CODE_COOKIE_NAME = 'biliPasswordResetCode';
export const BILI_PASSWORD_RESET_VERIFIER_COOKIE_NAME = 'biliPasswordResetVerifier';

export interface AuthCookieDurations {
  accessTokenSeconds: number;
  refreshTokenSeconds: number;
  biliRegisterSeconds: number;
}

export interface AuthCookieOptions {
  accessToken: CookieOptions;
  refreshToken: CookieOptions;
  authState: CookieOptions;
  biliRegister: CookieOptions;
}

/**
 * 由 API Origin 推导是否需要 Secure Cookie。
 *
 * 避免读取环境变量, 同时保证非 HTTPS 的本地开发仍能收到 Cookie。
 */
export function isSecureOrigin(apiOrigin: string) {
  return !apiOrigin.startsWith('http://');
}

export function getAuthStateCookieOptions(
  apiOrigin: string,
  webOrigins: string[],
  secure = isSecureOrigin(apiOrigin),
): CookieOptions {
  const apiHostname = new URL(apiOrigin).hostname;

  const webHostname = webOrigins
    .map(origin => new URL(origin).hostname)
    .filter(hostname => apiHostname === hostname || apiHostname.endsWith(`.${hostname}`))
    .sort((left, right) => right.length - left.length)[0];

  if (!webHostname) {
    throw new Error('API Origin hostname 必须等于或隶属于某个 Web Origin hostname');
  }

  return {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    ...(apiHostname === webHostname ? {} : { domain: webHostname }),
  };
}

export function createAuthCookieOptions(input: {
  apiOrigin: string;
  webOrigins: string[];
  durations: AuthCookieDurations;
}): AuthCookieOptions {
  const { apiOrigin, webOrigins, durations } = input;
  const secure = isSecureOrigin(apiOrigin);

  return {
    accessToken: {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: durations.accessTokenSeconds,
    },
    refreshToken: {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: durations.refreshTokenSeconds,
    },
    authState: {
      ...getAuthStateCookieOptions(apiOrigin, webOrigins, secure),
      maxAge: durations.refreshTokenSeconds,
    },
    biliRegister: {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: durations.biliRegisterSeconds,
    },
  };
}
