import type { CookieOptions } from 'elysia';

export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
export const AUTH_STATE_COOKIE_NAME = 'auth';
export const AUTH_STATE_COOKIE_VALUE = '1';
export const AUTH_COOKIE_NAME = ACCESS_TOKEN_COOKIE_NAME;
export const BILI_REGISTER_CODE_COOKIE_NAME = 'biliRegisterCode';
export const BILI_REGISTER_VERIFIER_COOKIE_NAME = 'biliRegisterVerifier';

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 15;
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;
export const BILI_REGISTER_EXPIRES_IN_SECONDS = 60 * 5;

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
} satisfies CookieOptions;

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} satisfies CookieOptions;

export const AUTH_STATE_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} satisfies CookieOptions;

export function getAuthStateCookieOptions(apiOrigin: string, webOrigins: string[]) {
  const apiHostname = new URL(apiOrigin).hostname;
  const webHostname = webOrigins
    .map(origin => new URL(origin).hostname)
    .filter(hostname => apiHostname === hostname || apiHostname.endsWith(`.${hostname}`))
    .sort((left, right) => right.length - left.length)[0];

  if (!webHostname) {
    throw new Error('API Origin hostname 必须等于或隶属于某个 Web Origin hostname');
  }

  return {
    ...AUTH_STATE_COOKIE_OPTIONS,
    ...(apiHostname === webHostname ? {} : { domain: webHostname }),
  } satisfies CookieOptions;
}

export const BILI_REGISTER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: BILI_REGISTER_EXPIRES_IN_SECONDS,
} satisfies CookieOptions;

export const AUTH_COOKIE_OPTIONS = ACCESS_TOKEN_COOKIE_OPTIONS;
