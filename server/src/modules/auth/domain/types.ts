export interface AuthPayload {
  /**
   * 登录账号 ID
   */
  id: string;

  /**
   * 登录账号角色
   *
   * 默认为 `user` (undefined)
   */
  role?: 'user' | 'admin' | 'superAdmin';

  /**
   * Redis 会话 ID
   */
  sid: string;
}

export type AuthRole = NonNullable<AuthPayload['role']>;

export interface AuthSession {
  accountId: string;
  role: AuthRole;
  sessionId: string;
  createdAt: string;
}

export interface BiliRegisterChallenge {
  status: 'pending' | 'matched' | 'consumed';
  code: string;
  verifierHash: string;
  createdAt: string;
  expiresAt: string;
  biliUid?: string;
  biliName?: string;
  matchedAt?: string;
  consumedAt?: string;
}
