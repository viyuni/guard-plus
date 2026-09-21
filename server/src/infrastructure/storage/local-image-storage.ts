import { createHash } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { type InferInput, ripple } from 'cyrenejs';

import { ImageSavePath } from '#composition/tokens';

import { InvalidImageSizeError } from './errors';

/**
 * 本地磁盘图片存储。
 *
 * 技术能力, 不含业务规则; 对外只通过 `ImageStorage` 令牌被消费方使用。
 */
export const LocalImageStorage = ripple(
  {
    ImageSavePath,
  },
  ({ ImageSavePath }) => {
    async function ensureImageDir() {
      await mkdir(ImageSavePath, { recursive: true });
    }

    async function exists(filePath: string) {
      try {
        await access(filePath);
        return true;
      } catch {
        return false;
      }
    }

    return {
      async save(file: File) {
        await ensureImageDir();

        const inputBuffer = Buffer.from(await file.arrayBuffer());

        const image = new Bun.Image(inputBuffer);

        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) {
          throw new InvalidImageSizeError();
        }

        const hash = createHash('sha256').update(inputBuffer).digest('hex');
        const hashPrefix = hash.slice(0, 32);

        const filename = `${hashPrefix}.webp`;
        const filePath = path.join(ImageSavePath, filename);

        const resizeImage = image.resize(512, 512, {
          fit: 'inside',
        });

        const isExists = await exists(filePath);

        // 避免重复上传
        if (isExists) {
          return {
            filename,
          };
        }

        await resizeImage
          .webp({
            quality: 80,
          })
          .write(filePath);

        return {
          filename,
        };
      },
    };
  },
  { debugName: 'LocalImageStorage' },
);

export type ImageStorage = InferInput<typeof LocalImageStorage>;
