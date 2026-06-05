import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export interface UserBasicInfo {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UserEncryptedBasicInfo {
  phoneEncrypted: string | null | undefined;
  emailEncrypted: string | null | undefined;
  phoneHash: string | null | undefined;
  addressEncrypted: string | null | undefined;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const FORMAT_VERSION = 'v1';

export class UserBasicInfoCrypto {
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = createHash('sha256').update(secret).digest();
  }

  encryptBasicInfo(input: UserBasicInfo): UserEncryptedBasicInfo {
    return {
      phoneEncrypted: this.encryptNullable(input.phone),
      emailEncrypted: this.encryptNullable(input.email),
      phoneHash: this.hashNullable(input.phone),
      addressEncrypted: this.encryptNullable(input.address),
    };
  }

  encryptBasicInfoPatch(input: UserBasicInfo): Partial<UserEncryptedBasicInfo> {
    return {
      ...('phone' in input
        ? {
            phoneEncrypted: this.encryptNullable(input.phone),
            phoneHash: this.hashNullable(input.phone),
          }
        : {}),
      ...('email' in input ? { emailEncrypted: this.encryptNullable(input.email) } : {}),
      ...('address' in input ? { addressEncrypted: this.encryptNullable(input.address) } : {}),
    };
  }

  decryptBasicInfo(input: {
    phoneEncrypted?: string | null;
    emailEncrypted?: string | null;
    addressEncrypted?: string | null;
  }): UserBasicInfo {
    return {
      phone: this.decryptNullable(input.phoneEncrypted),
      email: this.decryptNullable(input.emailEncrypted),
      address: this.decryptNullable(input.addressEncrypted),
    };
  }

  encryptNullable(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (!value) {
      return null;
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      FORMAT_VERSION,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  decryptNullable(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const [version, ivValue, authTagValue, encryptedValue] = value.split(':');

    if (version !== FORMAT_VERSION || !ivValue || !authTagValue || !encryptedValue) {
      return value;
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  hashNullable(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (!value) {
      return null;
    }

    return createHash('sha256').update(this.key).update(value).digest('hex');
  }
}
