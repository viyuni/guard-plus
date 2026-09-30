import { createHash } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { type InferInput, ripple } from 'cyrenex';

import { ImageSavePath } from '#config';

import { InvalidImageSizeError } from './errors';

/**
 * 本地磁盘图片存储。
 *
 * 技术能力, 不含业务规则; 消费方只依赖 `ImageStorage` 这一条声明,
 * 存储目录来自组合层的 `ImageSavePath` 配置 ripple。
 */
export const ImageStorage = ripple(
  'ImageStorage',
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
);

export type ImageStorage = InferInput<typeof ImageStorage>;
