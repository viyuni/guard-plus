const POSTGRES_INTEGER_MIN = -2_147_483_648;
const POSTGRES_INTEGER_MAX = 2_147_483_647;

export interface IntegerPolicyOptions {
  createError: (message: string) => Error;
  label: string;
}

/**
 * 数值型领域策略工厂。
 *
 * 原先用抽象类 + `protected static override` 注入 label 与错误类型，
 * 这里换成工厂函数：返回纯函数集合，各领域用自己的错误类型与名称实例化。
 */
export function createIntegerPolicy({ createError, label }: IntegerPolicyOptions) {
  function assertIsInteger(value: number) {
    if (!Number.isInteger(value)) {
      throw createError(`${label}必须为整数`);
    }

    if (value < POSTGRES_INTEGER_MIN || value > POSTGRES_INTEGER_MAX) {
      throw createError(`${label}超出整数范围`);
    }
  }

  function assertPositiveInteger(value: number) {
    assertIsInteger(value);

    if (value <= 0) {
      throw createError(`${label}必须大于 0`);
    }
  }

  function assertNonZeroInteger(value: number) {
    assertIsInteger(value);

    if (value === 0) {
      throw createError(`${label}不能为 0`);
    }
  }

  function assertCanAdd(current: number, amount: number) {
    assertIsInteger(current + amount);
  }

  return { assertCanAdd, assertIsInteger, assertNonZeroInteger, assertPositiveInteger };
}
