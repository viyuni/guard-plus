import { ripple } from 'cyrenejs';

import { ImageSavePath } from '#context/tokens';

import { ImageUseCase } from './usecase';

export const imageUseCase = ripple(
  { imageSavePath: ImageSavePath },
  ({ imageSavePath }) => new ImageUseCase(imageSavePath),
  { debugName: 'ImageUseCase' },
);
