import { defineRipples } from 'cyrenejs';

import { BiliEventRepo } from './repository';

// 静态领域 API
export * from './domain';

/** bili-event 模块的 Ripple Manifest。 */
export default defineRipples({
  BiliEventRepo,
});
