import { AdminRepo } from './repository';
import { AdminUseCase } from './usecase';

// 静态领域 API
export * from './domain';

/** Admin App 专属的管理员账号能力。 */
export default {
  AdminRepo,
  AdminUseCase,
};
