import { defineRipples } from 'cyrenejs';

import { UserAuthUseCase } from './usecase';

/** User App 专属的登录 / 注册 / 找回密码能力。 */
export default defineRipples({
  UserAuthUseCase,
});
