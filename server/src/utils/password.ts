import { randomInt } from 'node:crypto';

export class PasswordUtil {
  private static readonly LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly DIGITS = '0123456789';
  private static readonly SYMBOLS = '!@#$%^&*_-+=';
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 32;

  /**
   * 生成指定长度的随机密码
   * @default 16
   */
  static generate(length = 16) {
    this.assertValidLength(length);

    const chars: string[] = [this.randomChar(this.LETTERS), this.randomChar(this.DIGITS)];

    const allChars = this.LETTERS + this.DIGITS + this.SYMBOLS;

    while (chars.length < length) {
      chars.push(this.randomChar(allChars));
    }

    return this.shuffle(chars).join('');
  }

  private static assertValidLength(length: number) {
    if (!Number.isInteger(length)) {
      throw new Error('Password length must be an integer');
    }

    if (length < this.MIN_LENGTH || length > this.MAX_LENGTH) {
      throw new Error(`Password length must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH}`);
    }
  }

  private static randomChar(chars: string) {
    return chars[randomInt(0, chars.length)]!;
  }

  private static shuffle<T>(items: T[]) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = randomInt(0, i + 1);
      [items[i], items[j]] = [items[j]!, items[i]!];
    }

    return items;
  }

  static hash(password: string) {
    return Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: this.hashCost(),
    });
  }

  static verify(password: string, hash: string) {
    return Bun.password.verify(password, hash, 'bcrypt');
  }

  private static hashCost() {
    const cost = Number(Bun.env.PASSWORD_HASH_COST ?? 12);

    if (!Number.isInteger(cost) || cost < 4 || cost > 31) {
      throw new Error('PASSWORD_HASH_COST must be an integer between 4 and 31');
    }

    return cost;
  }
}
