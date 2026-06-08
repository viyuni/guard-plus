import { afterEach, beforeAll, describe, expect } from 'bun:test';

import type { CreatePointConversionRuleBody } from '@shared/schema/point-conversion';
import type { CreateRewardRuleBody } from '@shared/schema/reward';
import { and, inArray, like } from 'drizzle-orm';

import type { DbClient } from '#db';
import {
  orders,
  biliEvents,
  pointAccounts,
  pointConversionRules,
  pointTransactions,
  pointTypes,
  products,
  productStockMovements,
  rewardRules,
  users,
} from '#db/schema';

import { createContainer } from '../../context';
import type { BiliGuardRewardEvent } from '../../modules/reward';
import { getTestDatabase } from './test-database';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const batches = new Set<string>();

export const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

export let db: DbClient;

export function installConcurrencyTestHooks() {
  beforeAll(() => {
    if (!testDatabaseUrl) return;
    db = getTestDatabase();
  });

  afterEach(async () => {
    if (!db) return;

    try {
      for (const batch of batches) {
        await cleanupBatch(batch);
      }
    } finally {
      batches.clear();
    }
  });
}

export function newBatch(namespace = 'shared') {
  const batch = `${namespace}_concurrency_${crypto.randomUUID().slice(0, 8)}`;
  batches.add(batch);
  return batch;
}

export function expectSeeded<T>(value: T | null | undefined, message: string): T {
  if (!value) throw new Error(message);
  return value;
}

export async function expectRejectsInstanceOf<T extends Error>(
  promise: Promise<unknown>,
  errorType: new (...args: never[]) => T,
) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(errorType);
    return;
  }

  throw new Error(`expected promise to reject with ${errorType.name}`);
}

export function createDeps() {
  const { repositories, useCases } = createContainer({
    db,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      IMAGE_SAVE_PATH: '',
      REDIS_URL: 'redis://localhost:6379',
      REDIS_CONNECTION_TIMEOUT_MS: 5000,
      REDIS_IDLE_TIMEOUT_MS: 0,
      REDIS_MAX_RETRIES: 100,
      BILI_REGISTER_CODE_TTL_SECONDS: 300,
      BILI_ROOM: 721,
      JWT_SECRET: 'test',
      DATA_SECRET: 'test',
    },
  });

  return {
    ...repositories,
    ...useCases,
  };
}

export async function seedPointType(name: string) {
  const { pointTypeUseCase } = createDeps();
  const pointType = expectSeeded(
    await pointTypeUseCase.create({
      name,
    }),
    'seed point type failed',
  );

  return expectSeeded(await pointTypeUseCase.enable(pointType.id), 'seed point type failed');
}

export async function seedUser(name: string, biliUid?: `${number}`) {
  const userBiliUid =
    biliUid ?? (`${Date.now()}${Math.floor(Math.random() * 100_000_000)}` as const);
  const created = await createDeps().userUseCase.create({
    biliUid: userBiliUid,
    username: name,
    password: 'test_password',
  });
  const user = await db.query.users.findFirst({ where: { id: created.id } });

  return expectSeeded(user, 'seed user failed');
}

export async function seedProduct(input: {
  name: string;
  pointTypeId: string;
  price: number;
  endAt?: Date;
  startAt?: Date;
  stock: number;
}) {
  const { productUseCase } = createDeps();
  const product = expectSeeded(
    await productUseCase.create({
      ...input,
    }),
    'seed product failed',
  );

  return expectSeeded(await productUseCase.active(product.id), 'seed product failed');
}

export async function seedConversionFixture(
  prefix: string,
  overrides: Partial<CreatePointConversionRuleBody> = {},
) {
  const fromPointType = await seedPointType(`${prefix}_from_point`);
  const toPointType = await seedPointType(`${prefix}_to_point`);
  const user = await seedUser(`${prefix}_conversion_user`);
  const rule = await createDeps().pointConversionUseCase.create({
    name: `${prefix}_conversion_rule`,
    fromPointTypeId: fromPointType.id,
    toPointTypeId: toPointType.id,
    toAmount: 10,
    enabled: true,
    ...overrides,
  });

  return {
    fromPointType,
    rule: expectSeeded(rule, 'seed conversion rule failed'),
    toPointType,
    user,
  };
}

export async function createConversionRule(
  prefix: string,
  fromPointTypeId: string,
  toPointTypeId: string,
  overrides: Partial<CreatePointConversionRuleBody> = {},
) {
  const rule = await createDeps().pointConversionUseCase.create({
    name: `${prefix}_conversion_rule`,
    fromPointTypeId,
    toPointTypeId,
    toAmount: 10,
    enabled: true,
    ...overrides,
  });

  return expectSeeded(rule, 'seed conversion rule failed');
}

export async function createRewardRule(
  prefix: string,
  pointTypeId: string,
  overrides: Partial<CreateRewardRuleBody> = {},
) {
  const rule = await createDeps().rewardRuleUseCase.create({
    name: `${prefix}_reward_rule_${crypto.randomUUID().slice(0, 8)}`,
    conditions: {
      type: 'biliGuard',
      guardTypes: [3],
    },
    pointTypeId,
    points: 10,
    enabled: true,
    ...overrides,
  });

  return expectSeeded(rule, 'seed reward rule failed');
}

export async function grantPoints(input: {
  adminId: string;
  userId: string;
  pointTypeId: string;
  delta: number;
  nonce: string;
}) {
  return createDeps().pointAccountUseCase.adjustBalance(input.adminId, {
    userId: input.userId,
    pointTypeId: input.pointTypeId,
    delta: input.delta,
    nonce: input.nonce,
  });
}

export function createBiliGuardEvent(
  prefix: string,
  uid: number,
  overrides: Partial<BiliGuardRewardEvent> = {},
): BiliGuardRewardEvent {
  return {
    cmd: 'USER_TOAST_MSG_V2',
    type: 'guard',
    id: `${prefix}_guard_event`,
    uid,
    uname: `${prefix}_user`,
    face: '',
    message: `${prefix}_user 开通了舰长`,
    guardType: 3,
    guardName: '舰长',
    price: 198000,
    priceNormalized: 198,
    duration: 1,
    total: 198000,
    totalNormalized: 198,
    isYearGuard: false,
    unit: '月',
    color: '#00aeec',
    guardTotalCount: 1,
    effectId: 0,
    roomId: 1,
    timestamp: Date.now(),
    timestampNormalized: Date.now(),
    eventListenerUid: 1,
    read: false,
    ...overrides,
  } as BiliGuardRewardEvent;
}

export function createBiliUid(): `${number}` {
  return `${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}

async function cleanupBatch(batch: string) {
  const batchUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.username, `${batch}%`));
  const userIds = batchUsers.map(user => user.id);

  const batchPointTypes = await db
    .select({ id: pointTypes.id })
    .from(pointTypes)
    .where(like(pointTypes.name, `${batch}%`));
  const pointTypeIds = batchPointTypes.map(pointType => pointType.id);

  const batchProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(like(products.name, `${batch}%`));
  const productIds = batchProducts.map(product => product.id);

  if (userIds.length > 0) {
    await db.delete(biliEvents).where(inArray(biliEvents.userId, userIds));
    await db.delete(orders).where(inArray(orders.userId, userIds));
  }

  await db.delete(biliEvents).where(like(biliEvents.biliEventId, `${batch}%`));

  if (productIds.length > 0) {
    await db
      .delete(productStockMovements)
      .where(inArray(productStockMovements.productId, productIds));
  }

  if (userIds.length > 0) {
    await db.delete(pointTransactions).where(inArray(pointTransactions.userId, userIds));
    await db.delete(pointAccounts).where(inArray(pointAccounts.userId, userIds));
    await db.delete(users).where(inArray(users.id, userIds));
  }

  if (pointTypeIds.length > 0) {
    await db.delete(pointTransactions).where(inArray(pointTransactions.pointTypeId, pointTypeIds));
    await db.delete(pointAccounts).where(inArray(pointAccounts.pointTypeId, pointTypeIds));
    await db.delete(rewardRules).where(inArray(rewardRules.pointTypeId, pointTypeIds));

    await db
      .delete(pointConversionRules)
      .where(
        and(
          inArray(pointConversionRules.fromPointTypeId, pointTypeIds),
          inArray(pointConversionRules.toPointTypeId, pointTypeIds),
        ),
      );
  }

  if (productIds.length > 0) {
    await db.delete(products).where(inArray(products.id, productIds));
  }

  if (pointTypeIds.length > 0) {
    await db.delete(pointTypes).where(inArray(pointTypes.id, pointTypeIds));
  }
}
