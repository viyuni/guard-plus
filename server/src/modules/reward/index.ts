import { defineRipples } from 'cyrenejs';

import { RewardRuleRepo } from './repository';
import {
  BiliGuardRewardUseCase,
  ManualRewardUseCase,
  RewardProcessor,
  RewardQuery,
  RewardReplayUseCase,
  RewardRuleUseCase,
} from './usecase';

// 静态领域 API
export * from './domain';
export type { RewardProcessor as RewardProcessorService } from './usecase';

/** reward 模块的 Ripple Manifest。 */
export default defineRipples({
  RewardRuleRepo,

  RewardProcessor,
  BiliGuardRewardUseCase,
  RewardQuery,
  RewardRuleUseCase,
  ManualRewardUseCase,
  RewardReplayUseCase,
});
