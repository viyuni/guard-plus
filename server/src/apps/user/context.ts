import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { userEnv } from '#apps/user/env';
import { createAppContext } from '#context';
import { Database } from '#context/tokens';
import { db } from '#db';
import { authUseCase, biliPasswordResetUseCase, biliRegisterUseCase } from '#modules/auth/context';
import { pointAccountUseCase } from '#modules/point/context';
import { rewardUseCase } from '#modules/reward/context';
import { userUseCase } from '#modules/user/context';
import { redis } from '#redis';
import { logger } from '#utils/logger';

import { AuthUseCase as UserAuthUseCase } from './modules/auth/usecase';
import { createMailer } from './modules/email/domain';
import { EmailUseCase } from './modules/email/usecase';
import { NotifyWorker } from './modules/email/worker';

const { context, container } = await createAppContext({
  db,
  redis,
  env: {
    ...userEnv,
    API_ORIGIN: userEnv.USER_API_ORIGIN,
    JWT_SECRET: userEnv.USER_JWT_SECRET,
    WEB_ORIGINS: userEnv.USER_WEB_ORIGINS,
  },
});

const userAuthUseCaseProvider = ripple(
  {
    db: Database,
    authUseCase,
    biliPasswordResetUseCase,
    biliRegisterUseCase,
    pointAccountUseCase,
    rewardUseCase,
    userUseCase,
  },
  deps =>
    new UserAuthUseCase({
      ...deps,
      biliRoom: userEnv.BILI_ROOM,
      logger: logger.scope('UserAuthUseCase'),
    }),
  { debugName: 'UserAuthUseCase' },
);

const mailerProvider = ripple({}, () => createMailer(userEnv), {
  debugName: 'Mailer',
  dispose: mailer => mailer?.close(),
});

const emailUseCaseProvider = ripple(
  { mailer: mailerProvider },
  ({ mailer }) =>
    new EmailUseCase({
      mailer,
      notifyEmails: userEnv.NOTIFY_EMAILS,
    }),
  { debugName: 'EmailUseCase' },
);

const notifyWorkerProvider = ripple(
  { emailUseCase: emailUseCaseProvider },
  deps => new NotifyWorker(deps),
  {
    debugName: 'NotifyWorker',
    dispose: worker => worker.instance.close(),
  },
);

const { emailUseCase, notifyWorker, userAuthUseCase } = await container.runtime
  .resolve(
    ripple(
      {
        userAuthUseCase: userAuthUseCaseProvider,
        emailUseCase: emailUseCaseProvider,
        notifyWorker: notifyWorkerProvider,
      },
      deps => deps,
    ),
  )
  .catch(async error => {
    await container.runtime.dispose();
    throw error;
  });

/**
 * 真实运行时上下文。
 *
 * 只能在根 app 挂载一次。
 */
export const appRuntimeContext = context.decorate({
  userAuthUseCase,
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
  name: 'UserAppContextTypeOnly',
}) as unknown as typeof appRuntimeContext;

appRuntimeContext.onStart(() => {
  logger.info('Notify Worker started...');
});
