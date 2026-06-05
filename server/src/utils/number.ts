const POSTGRES_INTEGER_MIN = -2_147_483_648;
const POSTGRES_INTEGER_MAX = 2_147_483_647;

export abstract class IntegerValuePolicy {
  protected static label = '数值';

  protected static createError(message: string): Error {
    return new Error(message);
  }

  static assertIsInteger(value: number) {
    if (!Number.isInteger(value)) {
      throw this.createError(`${this.label}必须为整数`);
    }

    if (value < POSTGRES_INTEGER_MIN || value > POSTGRES_INTEGER_MAX) {
      throw this.createError(`${this.label}超出整数范围`);
    }
  }

  static assertPositiveInteger(value: number) {
    this.assertIsInteger(value);

    if (value <= 0) {
      throw this.createError(`${this.label}必须大于 0`);
    }
  }

  static assertNonZeroInteger(value: number) {
    this.assertIsInteger(value);

    if (value === 0) {
      throw this.createError(`${this.label}不能为 0`);
    }
  }

  static assertCanAdd(current: number, amount: number) {
    this.assertIsInteger(current + amount);
  }
}
