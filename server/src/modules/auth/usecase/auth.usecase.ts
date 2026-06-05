import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

import { UnauthorizedError } from '#utils';

import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthPayload, AuthRole } from '../domain';
import type { AuthSessionRedisRepository } from '../repository';

type AuthTokenType = 'access' | 'refresh';
type AuthIdentity = Omit<AuthPayload, 'sid'>;

const REFRESH_LOCK_TTL_MS = 5000;
const REFRESH_RESULT_TTL_SECONDS = 5;
const REFRESH_RESULT_POLL_INTERVAL_MS = 50;
const REFRESH_RESULT_POLL_ATTEMPTS = 20;

function getTokenExpiresInSeconds(type: AuthTokenType) {
  return type === 'access' ? ACCESS_TOKEN_EXPIRES_IN_SECONDS : REFRESH_TOKEN_EXPIRES_IN_SECONDS;
}

export class AuthUseCase {
  private encodedSecret: Uint8Array<ArrayBuffer>;

  constructor(
    private secret: string,
    private readonly authSessionRepo: AuthSessionRedisRepository,
  ) {
    this.encodedSecret = new TextEncoder().encode(this.secret);
  }

  private async signToken(payload: AuthPayload, type: AuthTokenType) {
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
      .sign(this.encodedSecret);
  }

  async signAccessToken(payload: AuthPayload) {
    return this.signToken(payload, 'access');
  }

  async signRefreshToken(payload: AuthPayload) {
    return this.signToken(payload, 'refresh');
  }

  async signTokenPair(payload: AuthPayload) {
    const now = Date.now();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return {
      accessToken,
      accessTokenExpiresAt: now + ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
      refreshToken,
      refreshTokenExpiresAt: now + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    };
  }

  async createSessionTokenPair(identity: AuthIdentity) {
    const role = this.normalizeRole(identity.role);
    const session = await this.authSessionRepo.create(identity.id, role);

    return this.signTokenPair({
      ...identity,
      role,
      sid: session.sessionId,
    });
  }

  private async verifyToken(token: string, expectedType: AuthTokenType) {
    try {
      const { payload } = await jwtVerify<AuthPayload & { type?: AuthTokenType }>(
        token,
        this.encodedSecret,
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

      const role = this.normalizeRole(payload.role);
      const session = await this.authSessionRepo.find(role, payload.sid);

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

  private normalizeRole(role: AuthPayload['role']): AuthRole {
    return role ?? 'user';
  }

  async verifyAccessToken(token: string) {
    return this.verifyToken(token, 'access');
  }

  async verifyRefreshToken(token: string) {
    return this.verifyToken(token, 'refresh');
  }

  async refreshAccessToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    return this.signAccessToken(payload);
  }

  async refreshAccessTokenWithLock(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const cached = await this.authSessionRepo.getRefreshResult(payload.role, payload.sid);

    if (cached) {
      return {
        payload,
        accessToken: cached,
      };
    }

    const lockValue = nanoid();
    const locked = await this.authSessionRepo.acquireRefreshLock(
      payload.role,
      payload.sid,
      lockValue,
      REFRESH_LOCK_TTL_MS,
    );

    if (!locked) {
      const accessToken = await this.waitForRefreshResult(payload.role, payload.sid);

      return {
        payload,
        accessToken,
      };
    }

    try {
      const accessToken = await this.signAccessToken(payload);
      await this.authSessionRepo.saveRefreshResult(
        payload.role,
        payload.sid,
        accessToken,
        REFRESH_RESULT_TTL_SECONDS,
      );

      return {
        payload,
        accessToken,
      };
    } finally {
      await this.authSessionRepo.releaseRefreshLock(payload.role, payload.sid, lockValue);
    }
  }

  private async waitForRefreshResult(role: AuthRole, sessionId: string) {
    for (let i = 0; i < REFRESH_RESULT_POLL_ATTEMPTS; i++) {
      await Bun.sleep(REFRESH_RESULT_POLL_INTERVAL_MS);

      const accessToken = await this.authSessionRepo.getRefreshResult(role, sessionId);

      if (accessToken) {
        return accessToken;
      }
    }

    throw new UnauthorizedError('登录状态正在刷新，请重试');
  }

  async revoke(payload: AuthPayload) {
    await this.authSessionRepo.delete(this.normalizeRole(payload.role), payload.sid);
  }

  async revokeByAccessToken(accessToken: string) {
    const payload = await this.verifyAccessToken(accessToken);

    await this.revoke(payload);
  }
}
