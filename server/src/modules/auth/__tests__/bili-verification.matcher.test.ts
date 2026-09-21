import { describe, expect, mock, test } from 'bun:test';

import type { BiliRegisterRedisRepository } from '../repository';
import { createBiliVerificationMatcher } from '../usecase/bili-verification.matcher';

function createRepository(matchPending: BiliRegisterRedisRepository['matchPending']) {
  return {
    matchPending,
  } as BiliRegisterRedisRepository;
}

describe('BiliVerificationMatcher', () => {
  test('routes register and password reset codes to their own repositories', async () => {
    const registerMatch = mock(() => Promise.resolve(null));
    const passwordResetMatch = mock(() => Promise.resolve(null));

    const matcher = createBiliVerificationMatcher({
      registerRepo: createRepository(registerMatch),
      passwordResetRepo: createRepository(passwordResetMatch),
    });

    await matcher.matchMessage({
      content: '  v-abc123 ',
      biliUid: '721',
      biliName: '测试用户',
    });
    await matcher.matchMessage({
      content: 'p-def456',
      biliUid: '722',
    });

    expect(registerMatch).toHaveBeenCalledWith('V-ABC123', '721', '测试用户');
    expect(passwordResetMatch).toHaveBeenCalledWith('P-DEF456', '722', undefined);
  });

  test('ignores unrelated messages without touching Redis repositories', async () => {
    const registerMatch = mock(() => Promise.resolve(null));
    const passwordResetMatch = mock(() => Promise.resolve(null));

    const matcher = createBiliVerificationMatcher({
      registerRepo: createRepository(registerMatch),
      passwordResetRepo: createRepository(passwordResetMatch),
    });

    const result = await matcher.matchMessage({
      content: '普通弹幕',
      biliUid: '721',
    });

    expect(result).toBeNull();
    expect(registerMatch).not.toHaveBeenCalled();
    expect(passwordResetMatch).not.toHaveBeenCalled();
  });
});
