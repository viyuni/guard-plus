import { defineRipples } from 'cyrenejs';

import { RewardRuleRepo } from './repository';
import {
  ManualRewardUseCase,
  RewardProcessor,
  RewardQuery,
  RewardReplayUseCase,
  RewardRuleUseCase,
} from './usecase';

// 静态领域 API
export * from './domain';

/** reward 模块的 Ripple Manifest。 */
export default defineRipples({
  RewardRuleRepo,

  RewardProcessor,
  RewardQuery,
  RewardRuleUseCase,
  ManualRewardUseCase,
  RewardReplayUseCase,
});
