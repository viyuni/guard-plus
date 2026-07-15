import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

import { UnauthorizedError } from '#utils';

import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthPayload, AuthRole, AuthTokenPair } from '../domain';
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

  private async signToken(payload: AuthPayload, type: AuthTokenType, tokenId?: string) {
    const expiresInSeconds = getTokenExpiresInSeconds(type);

    const jwt = new SignJWT({
      id: payload.id,
      role: payload.role,
      sid: payload.sid,
      type,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`);

    if (tokenId) {
      jwt.setJti(tokenId);
    }

    return jwt.sign(this.encodedSecret);
  }

  async signAccessToken(payload: AuthPayload) {
    return this.signToken(payload, 'access');
  }

  async signRefreshToken(payload: AuthPayload, refreshTokenId: string) {
    return this.signToken(payload, 'refresh', refreshTokenId);
  }

  async signTokenPair(payload: AuthPayload, refreshTokenId: string): Promise<AuthTokenPair> {
    const now = Date.now();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload, refreshTokenId),
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

    return this.signTokenPair(
      {
        ...identity,
        role,
        sid: session.sessionId,
      },
      session.refreshTokenId,
    );
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

      if (expectedType === 'refresh') {
        if (typeof payload.jti !== 'string' || session.refreshTokenId !== payload.jti) {
          throw new UnauthorizedError();
        }

        return {
          id: payload.id,
          role,
          sid: payload.sid,
          refreshTokenId: payload.jti,
        };
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
    const payload = await this.verifyRefreshTokenWithId(token);

    return {
      id: payload.id,
      role: payload.role,
      sid: payload.sid,
    };
  }

  private verifyRefreshTokenWithId(token: string) {
    return this.verifyToken(token, 'refresh') as Promise<
      AuthPayload & { role: AuthRole; refreshTokenId: string }
    >;
  }

  async refreshTokenPair(refreshToken: string) {
    const payload = await this.verifyRefreshTokenWithId(refreshToken);
    const nextRefreshTokenId = nanoid();
    const tokens = await this.signTokenPair(payload, nextRefreshTokenId);
    const rotated = await this.authSessionRepo.rotateRefreshToken(
      payload.role,
      payload.sid,
      payload.refreshTokenId,
      nextRefreshTokenId,
    );

    if (!rotated) {
      throw new UnauthorizedError();
    }

    return tokens;
  }

  async refreshTokenPairWithLock(refreshToken: string) {
    const payload = await this.verifyRefreshTokenWithId(refreshToken);
    const cached = await this.authSessionRepo.getRefreshResult(
      payload.role,
      payload.sid,
      payload.refreshTokenId,
    );

    if (cached) {
      return {
        payload,
        ...cached,
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
      const tokens = await this.waitForRefreshResult(
        payload.role,
        payload.sid,
        payload.refreshTokenId,
      );

      return {
        payload,
        ...tokens,
      };
    }

    try {
      const nextRefreshTokenId = nanoid();
      const tokens = await this.signTokenPair(payload, nextRefreshTokenId);
      const rotated = await this.authSessionRepo.rotateRefreshToken(
        payload.role,
        payload.sid,
        payload.refreshTokenId,
        nextRefreshTokenId,
      );

      if (!rotated) {
        throw new UnauthorizedError();
      }

      await this.authSessionRepo.saveRefreshResult(
        payload.role,
        payload.sid,
        payload.refreshTokenId,
        tokens,
        REFRESH_RESULT_TTL_SECONDS,
      );

      return {
        payload,
        ...tokens,
      };
    } finally {
      await this.authSessionRepo.releaseRefreshLock(payload.role, payload.sid, lockValue);
    }
  }

  private async waitForRefreshResult(role: AuthRole, sessionId: string, refreshTokenId: string) {
    for (let i = 0; i < REFRESH_RESULT_POLL_ATTEMPTS; i++) {
      await Bun.sleep(REFRESH_RESULT_POLL_INTERVAL_MS);

      const tokens = await this.authSessionRepo.getRefreshResult(role, sessionId, refreshTokenId);

      if (tokens) {
        return tokens;
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
