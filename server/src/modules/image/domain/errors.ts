import { BadRequestError } from '#utils';

export class InvalidImageSizeError extends BadRequestError {
  override code = 'INVALID_IMAGE_SIZE';

  constructor(message = '图片尺寸错误') {
    super(message);
  }
}
