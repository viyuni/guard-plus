import { type InferInput, ripple } from 'cyrenejs';
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

import { JwtSecret } from '#composition/tokens';
import { UnauthorizedError } from '#shared';

import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthPayload, AuthRole, AuthTokenPair } from '../domain';
import { AuthSessionRepo } from '../repository';

type AuthTokenType = 'access' | 'refresh';
type AuthIdentity = Omit<AuthPayload, 'sid'>;

const REFRESH_LOCK_TTL_MS = 5000;
const REFRESH_RESULT_TTL_SECONDS = 5;
const REFRESH_RESULT_POLL_INTERVAL_MS = 50;
const REFRESH_RESULT_POLL_ATTEMPTS = 20;

function getTokenExpiresInSeconds(type: AuthTokenType) {
  return type === 'access' ? ACCESS_TOKEN_EXPIRES_IN_SECONDS : REFRESH_TOKEN_EXPIRES_IN_SECONDS;
}

export const AuthUseCase = ripple(
  {
    AuthSessionRepo,
    JwtSecret,
  },
  ({ AuthSessionRepo, JwtSecret }) => {
    const encodedSecret = new TextEncoder().encode(JwtSecret);

    function normalizeRole(role: AuthPayload['role']): AuthRole {
      return role ?? 'user';
    }

    async function signToken(payload: AuthPayload, type: AuthTokenType) {
      const expiresInSeconds = getTokenExpiresInSeconds(type);

      return new SignJWT({
        id: payload.id,
        role: payload.role,
        sid: payload.sid,
        type,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expiresInSeconds}s`)
        .sign(encodedSecret);
    }

    async function signAccessToken(payload: AuthPayload) {
      return signToken(payload, 'access');
    }

    async function signRefreshToken(payload: AuthPayload) {
      return signToken(payload, 'refresh');
    }

    async function signTokenPair(payload: AuthPayload): Promise<AuthTokenPair> {
      const now = Date.now();

      const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(payload),
        signRefreshToken(payload),
      ]);

      return {
        accessToken,
        accessTokenExpiresAt: now + ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
        refreshToken,
        refreshTokenExpiresAt: now + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
      };
    }

    async function verifyToken(token: string, expectedType: AuthTokenType) {
      try {
        const { payload } = await jwtVerify<AuthPayload & { type?: AuthTokenType }>(
          token,
          encodedSecret,
        );

        if (typeof payload.id !== 'string') {
          throw new UnauthorizedError();
        }

        if (typeof payload.sid !== 'string') {
          throw new UnauthorizedError();
        }

        if (payload.type !== expectedType) {
          throw new UnauthorizedError();
        }

        // 确保角色是字符串
        if (payload.role !== undefined && typeof payload.role !== 'string') {
          throw new UnauthorizedError();
        }

        const role = normalizeRole(payload.role);
        const session = await AuthSessionRepo.find(role, payload.sid);

        if (!session || session.accountId !== payload.id) {
          throw new UnauthorizedError();
        }

        return {
          id: payload.id,
          role,
          sid: payload.sid,
        };
      } catch {
        throw new UnauthorizedError();
      }
    }

    async function waitForRefreshResult(role: AuthRole, sessionId: string) {
      for (let i = 0; i < REFRESH_RESULT_POLL_ATTEMPTS; i++) {
        await Bun.sleep(REFRESH_RESULT_POLL_INTERVAL_MS);

        const tokens = await AuthSessionRepo.getRefreshResult(role, sessionId);

        if (tokens) {
          return tokens;
        }
      }

      throw new UnauthorizedError('登录状态正在刷新，请重试');
    }

    async function refreshTokenPair(refreshToken: string) {
      const payload = await verifyToken(refreshToken, 'refresh');
      const extended = await AuthSessionRepo.extend(payload.role, payload.sid);

      if (!extended) {
        throw new UnauthorizedError();
      }

      return signTokenPair(payload);
    }

    async function revoke(payload: AuthPayload) {
      await AuthSessionRepo.delete(normalizeRole(payload.role), payload.sid);
    }

    return {
      signAccessToken,
      signRefreshToken,
      signTokenPair,

      async createSessionTokenPair(identity: AuthIdentity) {
        const role = normalizeRole(identity.role);
        const session = await AuthSessionRepo.create(identity.id, role);

        return signTokenPair({
          ...identity,
          role,
          sid: session.sessionId,
        });
      },

      verifyAccessToken(token: string) {
        return verifyToken(token, 'access');
      },

      verifyRefreshToken(token: string) {
        return verifyToken(token, 'refresh');
      },

      refreshTokenPair,

      async refreshTokenPairWithLock(refreshToken: string) {
        const payload = await verifyToken(refreshToken, 'refresh');
        const cached = await AuthSessionRepo.getRefreshResult(payload.role, payload.sid);

        if (cached) {
          return {
            payload,
            ...cached,
          };
        }

        const lockValue = nanoid();

        const locked = await AuthSessionRepo.acquireRefreshLock(
          payload.role,
          payload.sid,
          lockValue,
          REFRESH_LOCK_TTL_MS,
        );

        if (!locked) {
          const tokens = await waitForRefreshResult(payload.role, payload.sid);

          return {
            payload,
            ...tokens,
          };
        }

        try {
          const extended = await AuthSessionRepo.extend(payload.role, payload.sid);

          if (!extended) {
            throw new UnauthorizedError();
          }

          const tokens = await signTokenPair(payload);
          await AuthSessionRepo.saveRefreshResult(
            payload.role,
            payload.sid,
            tokens,
            REFRESH_RESULT_TTL_SECONDS,
          );

          return {
            payload,
            ...tokens,
          };
        } finally {
          await AuthSessionRepo.releaseRefreshLock(payload.role, payload.sid, lockValue);
        }
      },

      async revoke(payload: AuthPayload) {
        await revoke(payload);
      },

      async revokeByAccessToken(accessToken: string) {
        const payload = await verifyToken(accessToken, 'access');

        await revoke(payload);
      },
    };
  },
  { debugName: 'AuthUseCase' },
);

export type AuthUseCase = InferInput<typeof AuthUseCase>;
