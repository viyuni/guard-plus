import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { type InferInput, ripple } from 'cyrenejs';

import { DataSecret } from '#context/tokens';

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

export const userBasicInfoCrypto = ripple(
  {
    dataSecret: DataSecret,
  },
  ({ dataSecret }) => {
    const key = createHash('sha256').update(dataSecret).digest();

    function encryptNullable(value: string | null | undefined) {
      if (value === undefined) {
        return undefined;
      }

      if (!value) {
        return null;
      }

      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      return [
        FORMAT_VERSION,
        iv.toString('base64url'),
        authTag.toString('base64url'),
        encrypted.toString('base64url'),
      ].join(':');
    }

    function decryptNullable(value: string | null | undefined) {
      if (!value) {
        return null;
      }

      const [version, ivValue, authTagValue, encryptedValue] = value.split(':');

      if (version !== FORMAT_VERSION || !ivValue || !authTagValue || !encryptedValue) {
        return value;
      }

      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivValue, 'base64url'));
      decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    }

    function hashNullable(value: string | null | undefined) {
      if (value === undefined) {
        return undefined;
      }

      if (!value) {
        return null;
      }

      return createHash('sha256').update(key).update(value).digest('hex');
    }

    return {
      encryptBasicInfo(input: UserBasicInfo): UserEncryptedBasicInfo {
        return {
          phoneEncrypted: encryptNullable(input.phone),
          emailEncrypted: encryptNullable(input.email),
          phoneHash: hashNullable(input.phone),
          addressEncrypted: encryptNullable(input.address),
        };
      },

      encryptBasicInfoPatch(input: UserBasicInfo): Partial<UserEncryptedBasicInfo> {
        return {
          ...('phone' in input
            ? {
                phoneEncrypted: encryptNullable(input.phone),
                phoneHash: hashNullable(input.phone),
              }
            : {}),
          ...('email' in input ? { emailEncrypted: encryptNullable(input.email) } : {}),
          ...('address' in input ? { addressEncrypted: encryptNullable(input.address) } : {}),
        };
      },

      decryptBasicInfo(input: {
        phoneEncrypted?: string | null;
        emailEncrypted?: string | null;
        addressEncrypted?: string | null;
      }): UserBasicInfo {
        return {
          phone: decryptNullable(input.phoneEncrypted),
          email: decryptNullable(input.emailEncrypted),
          address: decryptNullable(input.addressEncrypted),
        };
      },
    };
  },
  { debugName: 'UserBasicInfoCrypto' },
);

export type UserBasicInfoCrypto = InferInput<typeof userBasicInfoCrypto>;
