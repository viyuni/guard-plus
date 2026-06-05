import { InternalServerError, NotFoundError } from '#utils';

export class BiliEventNotFoundError extends NotFoundError {
  override code = 'BILI_EVENT_NOT_FOUND';

  constructor(message = 'B站事件记录不存在') {
    super(message);
  }
}

export class BiliEventPersistFailedError extends InternalServerError {
  override code = 'BILI_EVENT_PERSIST_FAILED';

  constructor(message = 'B站事件记录保存失败') {
    super(message);
  }
}
