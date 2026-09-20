import { Cyrene } from 'cyrenejs';
import type { Resolvable } from 'cyrenejs';

import * as authRepository from '#modules/auth/repository';
import * as authUseCase from '#modules/auth/usecase';
import * as biliEventRepository from '#modules/bili-event/repository';
import * as dashboardRepository from '#modules/dashboard/repository';
import * as dashboardUseCase from '#modules/dashboard/usecase';
import * as orderRepository from '#modules/order/repository';
import * as orderUseCase from '#modules/order/usecase';
import * as pointRepository from '#modules/point/repository';
import * as pointUseCase from '#modules/point/usecase';
import * as productRepository from '#modules/product/repository';
import * as productUseCase from '#modules/product/usecase';
import * as rewardRepository from '#modules/reward/repository';
import * as rewardUseCase from '#modules/reward/usecase';
import * as userRepository from '#modules/user/repository';
import * as userUseCase from '#modules/user/usecase';

type ProviderKey<TNamespace> = {
  [TKey in keyof TNamespace]: TNamespace[TKey] extends Resolvable ? TKey : never;
}[keyof TNamespace];

/**
 * 从一个模块命名空间里挑出其中的 Cyrene provider, 并保留每个 provider 的精确类型。
 *
 * 判据完全来自 Cyrene 的公开 API：`Cyrene` 构造函数会对每个 provider 断言
 * 它必须是 Dependency / DependencyRef / Token，否则抛 `InvalidDependencyError`。
 * 因此本项目不需要再维护一份 provider 名单——新增 Repository 或 UseCase 时
 * 实现文件与 barrel 一改即可，装配侧零改动。
 */
export function providersOf<const TNamespace extends Record<string, unknown>>(
  namespace: TNamespace,
): Pick<TNamespace, ProviderKey<TNamespace>> {
  const providers: Record<string, Resolvable> = {};

  for (const [name, value] of Object.entries(namespace)) {
    if (isResolvable(value)) {
      providers[name] = value as Resolvable;
    }
  }

  return providers as Pick<TNamespace, ProviderKey<TNamespace>>;
}

function isResolvable(value: unknown) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }

  try {
    new Cyrene({ providers: { candidate: value as Resolvable } });

    return true;
  } catch {
    return false;
  }
}

/**
 * 共享容器全部 provider（扁平）。
 *
 * 从各模块的 `repository/` 与 `usecase/` 命名空间派生：
 * 新增 Repository 或 UseCase 时只需改实现文件与 barrel，装配侧零改动。
 */
export const providers = {
  ...providersOf(authRepository),
  ...providersOf(authUseCase),
  ...providersOf(biliEventRepository),
  ...providersOf(dashboardRepository),
  ...providersOf(dashboardUseCase),
  ...providersOf(orderRepository),
  ...providersOf(orderUseCase),
  ...providersOf(pointRepository),
  ...providersOf(pointUseCase),
  ...providersOf(productRepository),
  ...providersOf(productUseCase),
  ...providersOf(rewardRepository),
  ...providersOf(rewardUseCase),
  ...providersOf(userRepository),
  ...providersOf(userUseCase),
};
