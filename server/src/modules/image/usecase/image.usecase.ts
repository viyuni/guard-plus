import { createHash } from 'node:crypto';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { type InferInput, ripple } from 'cyrenejs';

import { ImageSavePath } from '#env/image';

import { InvalidImageSizeError } from '../domain';

export const imageUseCase = ripple(
  {
    imageSavePath: ImageSavePath,
  },
  ({ imageSavePath }) => {
    async function ensureImageDir() {
      await mkdir(imageSavePath, { recursive: true });
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
        const filePath = path.join(imageSavePath, filename);

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
  { debugName: 'ImageUseCase' },
);

export type ImageUseCase = InferInput<typeof imageUseCase>;
