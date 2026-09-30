import { type Dependency, ripple } from 'cyrenex';

/**
 * 测试替身。
 *
 * 用一条借用语义的 ripple 顶替真实实现: 容器不会接管它的生命周期,
 * 用例结束后由测试自己关闭。生产组合根不使用 override, 只有测试才需要。
 */
export function stub<T>(key: string, value: T): Dependency<T, {}, false> {
  return ripple(key, () => value, { ownership: 'borrowed' }) as unknown as Dependency<T, {}, false>;
}
