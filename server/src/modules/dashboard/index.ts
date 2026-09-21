import { defineRipples } from 'cyrenejs';

import { DashboardRepo } from './repository';
import { DashboardUseCase } from './usecase';

/** dashboard 模块的 Ripple Manifest。 */
export default defineRipples({
  DashboardRepo,
  DashboardUseCase,
});
