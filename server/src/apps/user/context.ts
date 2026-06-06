import Elysia from 'elysia';

import { userEnv } from '#apps/user/env';
import { createAppContext } from '#context';
import { db } from '#db';
import { logger } from '#utils/logger';

import { createMailer } from './modules/email/domain';
import { EmailUseCase } from './modules/email/usecase';
import { NotifyWorker } from './modules/email/worker';

const { context } = createAppContext({
  db,
  env: {
    ...userEnv,
    JWT_SECRET: userEnv.USER_JWT_SECRET,
  },
});

const emailUseCase = new EmailUseCase({
  mailer: createMailer(userEnv),
  notifyEmails: userEnv.NOTIFY_EMAILS,
});

const notifyWorker = new NotifyWorker({ emailUseCase });

/**
 * 真实运行时上下文。
 *
 * 只能在根 app 挂载一次。
 */
export const appRuntimeContext = context.decorate({
  emailUseCase,
  notifyWorker,
});

/**
 * 业务模块上下文。
 *
 * 仅用于业务模块获得 appRuntimeContext 的类型提示。
 * 运行时为空。
 *
 * 根 app 必须先 `.use(appRuntimeContext)`，再 `.use(业务模块)`。
 */
export const appContext = new Elysia({
  name: 'AdminAppContextTypeOnly',
}) as unknown as typeof appRuntimeContext;

appRuntimeContext.onStart(() => {
  logger.info('Notify Worker started...');
});
