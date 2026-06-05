import { createHash } from 'node:crypto';
import { mkdir, access } from 'node:fs/promises';
import path from 'node:path';

import { InvalidImageSizeError } from '../domain';

export class ImageUseCase {
  constructor(readonly imageSavePath: string) {}

  private async ensureImageDir() {
    await mkdir(this.imageSavePath, { recursive: true });
  }

  private async exists(filePath: string) {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async save(file: File) {
    await this.ensureImageDir();

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const image = new Bun.Image(inputBuffer);

    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new InvalidImageSizeError();
    }

    const hash = createHash('sha256').update(inputBuffer).digest('hex');
    const hashPrefix = hash.slice(0, 32);

    const filename = `${hashPrefix}.webp`;
    const filePath = path.join(this.imageSavePath, filename);
    const resizeImage = image.resize(512, 512, {
      fit: 'inside',
    });
    const isExists = await this.exists(filePath);

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
  }
}
