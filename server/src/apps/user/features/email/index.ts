import { defineRipples } from 'cyrenejs';

import { EmailUseCase } from './usecase';
import { NotifyWorker } from './worker';

/** User App 专属的订单通知邮件能力。 */
export default defineRipples({
  EmailUseCase,
  NotifyWorker,
});
