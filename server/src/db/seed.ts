import { fakerZH_CN as faker } from '@faker-js/faker';
import { seed as drizzleSeed } from 'drizzle-seed';

import { createDatabase, db } from '.';
import { createPointContext } from '../modules/point/context';
import type { BiliGuardRewardEvent } from '../modules/reward';
import { createRewardContext } from '../modules/reward/context';
import { createUserContext } from '../modules/user/context';
import {
  admins,
  pointTypes,
  pointConversionRules,
  products,
  productStockMovements,
  rewardRules,
  users,
  type InsertPointConversionRule,
  type InsertPointType,
  type InsertRewardRule,
  type PointType,
} from './schema';

const seedValue = 1270;
const userCount = 60;
const adminCount = 6;
const productsPerPointType = 12;
const stockMovementCount = 80;
const seedDefaultPassword = '123456789@qW';

faker.seed(seedValue);

const pointTypeData = [
  {
    name: '舰长积分',
    description: '开通舰长即可获得',
    icon: 'captain',
    status: 'active',
    sort: 400,
  },
  {
    name: '提督积分',
    description: '开通提督即可获得',
    icon: 'admiral',
    status: 'active',
    sort: 300,
  },
  {
    name: '总督积分',
    description: '开通总督即可获得',
    icon: 'governor',
    status: 'active',
    sort: 200,
  },
  {
    name: '活动积分',
    description: '特殊活动节日可获得',
    icon: 'activity',
    status: 'active',
    sort: 100,
  },
] satisfies InsertPointType[];

const productKinds = [
  ['周边礼包', '徽章、贴纸、明信片组合', 'manual'],
  ['直播间装扮', '直播间专属身份装扮', 'automatic'],
  ['限定头像框', '限时纪念头像框兑换', 'automatic'],
  ['签名收藏卡', '实体签名收藏卡', 'manual'],
  ['抽奖资格', '参与月度回馈抽奖', 'automatic'],
  ['生日礼盒', '生日主题纪念礼盒', 'manual'],
] as const;

function array<T>(count: number, create: (index: number) => T): T[] {
  return Array.from({ length: count }, (_, index) => create(index));
}

function uniqueArray<T>(count: number, create: (index: number) => T): T[] {
  const values = new Set<T>();

  while (values.size < count) {
    values.add(create(values.size));
  }

  return [...values];
}

function address() {
  return [
    faker.location.state(),
    faker.location.city(),
    faker.location.county(),
    faker.location.street(),
    `${faker.location.buildingNumber()}号`,
    faker.location.secondaryAddress(),
  ].join('');
}

const biliUids = array(userCount, index => (100000000 + index).toString());
const userNames = uniqueArray(userCount, index => `${faker.internet.username()}_${index + 1}`);
const userEmails = array(userCount, index => `seed-user-${index + 1}@example.com`);
const userPhones = array(
  userCount,
  index => `138${(seedValue * 100000 + index).toString().padStart(8, '0')}`,
);
const userAddresses = array(userCount, () => address());
const userRemarks = array(userCount, index =>
  faker.helpers.arrayElement([
    '资料完整用户',
    '高频兑换用户',
    '直播间活跃用户',
    '周边收藏用户',
    '新注册用户',
    '客服备注用户',
    `批量导入样例 ${index + 1}`,
  ]),
);
const userPhoneHashes = array(userCount, index => `seed-phone-hash-${index + 1}`);

const adminUids = array(adminCount, index => `admin-${(index + 1).toString().padStart(2, '0')}`);
const adminNames = [
  '系统管理员',
  '运营管理员',
  '客服管理员',
  '商品管理员',
  '审计管理员',
  '风控管理员',
];
const adminRemarks = ['系统维护', '活动运营', '用户支持', '商品维护', '数据审计', '风险控制'];

const productNames = pointTypeData.flatMap((_pointType, pointTypeIndex) =>
  array(productsPerPointType, index => {
    const [kindName] = productKinds[index % productKinds.length]!;
    const serial = pointTypeIndex * productsPerPointType + index + 1;

    return `${kindName} ${serial.toString().padStart(2, '0')}`;
  }),
);
const productDescriptions = pointTypeData.flatMap(pointType =>
  array(productsPerPointType, index => {
    const [, kindDescription] = productKinds[index % productKinds.length]!;

    return `${pointType.description}，${kindDescription}`;
  }),
);
const productCovers = array(productNames.length, index => `/images/seed/products/${index + 1}.png`);
const productDetails = productNames.map((name, index) =>
  [
    `## ${name}`,
    '',
    productDescriptions[index],
    '',
    '- 测试数据商品',
    '- 用于开发和验收兑换商城列表、详情、库存展示',
  ].join('\n'),
);
const productDeliveryContents = productNames.map(
  name => `兑换成功：${name}\n测试兑换码：SEED-CODE`,
);
const productPrices = array(productNames.length, index => 60 + (index % productsPerPointType) * 20);
const productStocks = array(
  productNames.length,
  index => 40 + faker.number.int({ min: 0, max: 260 }) - (index % 8),
);
const productDeliveryTypes = array(
  productNames.length,
  index => productKinds[index % productKinds.length]![2],
);
const productSorts = array(productNames.length, index => productNames.length - index);

const stockDeltas = array(stockMovementCount, () =>
  faker.helpers.arrayElement([10, 20, 30, 50, -1, -2]),
);
const stockBefore = array(stockMovementCount, () => faker.number.int({ min: 20, max: 300 }));
const stockAfter = stockBefore.map((before, index) => Math.max(0, before + stockDeltas[index]!));
const stockSourceIds = array(stockMovementCount, index => `seed-stock-${index + 1}`);
const stockIdempotencyKeys = array(stockMovementCount, index => `seedv2:stock:${index + 1}`);
const stockRemarks = stockDeltas.map(delta =>
  delta > 0 ? '测试数据入库调整' : '测试数据兑换扣减',
);

const seedRewardRuleNames = {
  jianzhang: '舰长月度奖励',
  tidu: '提督月度奖励',
  zongdu: '总督月度奖励',
} as const;

const seedPointConversionRuleNames = {
  tiduToJianzhang: '提督积分兑换舰长积分',
  zongduToJianzhang: '总督积分兑换舰长积分',
  zongduToTidu: '总督积分兑换提督积分',
  activityToJianzhang: '活动积分兑换舰长积分',
} as const;

function createSeedBiliGuardEvent(
  input: Pick<
    BiliGuardRewardEvent,
    | 'id'
    | 'uid'
    | 'uname'
    | 'guardType'
    | 'guardName'
    | 'total'
    | 'totalNormalized'
    | 'roomId'
    | 'timestamp'
  >,
): BiliGuardRewardEvent {
  return {
    cmd: 'USER_TOAST_MSG_V2',
    type: 'guard',
    face: '',
    message: `${input.uname} 开通了${input.guardName}`,
    price: input.total,
    priceNormalized: input.totalNormalized * 198,
    duration: input.totalNormalized,
    isYearGuard: false,
    unit: '月',
    color: '#00aeec',
    guardTotalCount: 1,
    effectId: 0,
    timestampNormalized: input.timestamp,
    eventListenerUid: input.roomId,
    read: false,
    ...input,
  };
}

const seedBiliGuardEvents = [
  createSeedBiliGuardEvent({
    id: 'seed-bili-guard-registered-jianzhang-001',
    uid: 100000000,
    uname: '测试已注册舰长',
    guardType: 3,
    guardName: '舰长',
    total: 198000,
    totalNormalized: 1,
    roomId: 1270,
    timestamp: new Date('2026-05-01T12:00:00.000Z').getTime(),
  }),
  createSeedBiliGuardEvent({
    id: 'seed-bili-guard-registered-tidu-001',
    uid: 100000001,
    uname: '测试已注册提督',
    guardType: 2,
    guardName: '提督',
    total: 1998000,
    totalNormalized: 10,
    roomId: 1270,
    timestamp: new Date('2026-05-02T12:00:00.000Z').getTime(),
  }),
  createSeedBiliGuardEvent({
    id: 'seed-bili-guard-unregistered-jianzhang-001',
    uid: 200000001,
    uname: '测试未注册舰长',
    guardType: 3,
    guardName: '舰长',
    total: 198000,
    totalNormalized: 1,
    roomId: 1270,
    timestamp: new Date('2026-05-03T12:00:00.000Z').getTime(),
  }),
  createSeedBiliGuardEvent({
    id: 'seed-bili-guard-unregistered-zongdu-001',
    uid: 200000002,
    uname: '测试未注册总督',
    guardType: 1,
    guardName: '总督',
    total: 19998000,
    totalNormalized: 100,
    roomId: 1270,
    timestamp: new Date('2026-05-04T12:00:00.000Z').getTime(),
  }),
] satisfies BiliGuardRewardEvent[];

async function findPointType(targetDb: typeof db, name: string) {
  const pointType = await targetDb.query.pointTypes.findFirst({
    where: {
      name,
    },
  });

  if (!pointType) {
    throw new Error(`Seed point type not found: ${name}`);
  }

  return pointType;
}

async function ensureRewardRule(targetDb: typeof db, input: InsertRewardRule) {
  const existing = await targetDb.query.rewardRules.findFirst({
    where: {
      name: input.name,
    },
  });

  if (existing) {
    return existing;
  }

  const [rule] = await targetDb.insert(rewardRules).values(input).returning();

  if (!rule) {
    throw new Error(`Seed reward rule failed: ${input.name}`);
  }

  return rule;
}

async function ensurePointConversionRule(targetDb: typeof db, input: InsertPointConversionRule) {
  const existing = await targetDb.query.pointConversionRules.findFirst({
    where: {
      name: input.name,
    },
  });

  if (existing) {
    return existing;
  }

  const [rule] = await targetDb.insert(pointConversionRules).values(input).returning();

  if (!rule) {
    throw new Error(`Seed point conversion rule failed: ${input.name}`);
  }

  return rule;
}

interface SeedRewardPointTypeMap {
  activity: PointType;
  jianzhang: PointType;
  tidu: PointType;
  zongdu: PointType;
}

async function seedRewardRules(targetDb: typeof db, pointTypeMap: SeedRewardPointTypeMap) {
  await ensureRewardRule(targetDb, {
    name: seedRewardRuleNames.jianzhang,
    description: '测试数据：舰长、提督、总督均可获得舰长积分。',
    conditions: {
      type: 'biliGuard',
      guardTypes: [1, 2, 3],
    },
    pointTypeId: pointTypeMap.jianzhang.id,
    points: 1,
    enabled: true,
    priority: 30,
  });

  await ensureRewardRule(targetDb, {
    name: seedRewardRuleNames.tidu,
    description: '测试数据：提督、总督均可获得提督积分。',
    conditions: {
      type: 'biliGuard',
      guardTypes: [1, 2],
    },
    pointTypeId: pointTypeMap.tidu.id,
    points: 1,
    enabled: true,
    priority: 20,
  });

  await ensureRewardRule(targetDb, {
    name: seedRewardRuleNames.zongdu,
    description: '测试数据：总督可获得总督积分。',
    conditions: {
      type: 'biliGuard',
      guardTypes: [1],
    },
    pointTypeId: pointTypeMap.zongdu.id,
    points: 1,
    enabled: true,
    priority: 10,
  });
}

async function seedPointConversionRules(targetDb: typeof db, pointTypeMap: SeedRewardPointTypeMap) {
  await ensurePointConversionRule(targetDb, {
    name: seedPointConversionRuleNames.tiduToJianzhang,
    description: '测试数据：提督积分可 1:1 转换为舰长积分。',
    fromPointTypeId: pointTypeMap.tidu.id,
    toPointTypeId: pointTypeMap.jianzhang.id,
    toAmount: 1,
    enabled: true,
  });

  await ensurePointConversionRule(targetDb, {
    name: seedPointConversionRuleNames.zongduToJianzhang,
    description: '测试数据：总督积分可 1:1 转换为舰长积分。',
    fromPointTypeId: pointTypeMap.zongdu.id,
    toPointTypeId: pointTypeMap.jianzhang.id,
    toAmount: 1,
    enabled: true,
  });

  await ensurePointConversionRule(targetDb, {
    name: seedPointConversionRuleNames.zongduToTidu,
    description: '测试数据：总督积分可 1:1 转换为提督积分。',
    fromPointTypeId: pointTypeMap.zongdu.id,
    toPointTypeId: pointTypeMap.tidu.id,
    toAmount: 1,
    enabled: true,
  });

  await ensurePointConversionRule(targetDb, {
    name: seedPointConversionRuleNames.activityToJianzhang,
    description: '测试数据：活动积分可 1:1 转换为舰长积分。',
    fromPointTypeId: pointTypeMap.activity.id,
    toPointTypeId: pointTypeMap.jianzhang.id,
    toAmount: 1,
    enabled: true,
  });
}

async function seedBiliGuardRewardEvents(targetDb: typeof db) {
  const pointTypeMap = {
    activity: await findPointType(targetDb, '活动积分'),
    jianzhang: await findPointType(targetDb, '舰长积分'),
    tidu: await findPointType(targetDb, '提督积分'),
    zongdu: await findPointType(targetDb, '总督积分'),
  };

  await seedRewardRules(targetDb, pointTypeMap);
  await seedPointConversionRules(targetDb, pointTypeMap);

  const user = createUserContext({
    db: targetDb,
    dataSecret: Bun.env.DATA_SECRET ?? 'seed-data-secret-seed-data-secret',
  });
  const point = createPointContext({
    db: targetDb,
    userUseCase: user.userUseCase,
  });
  const reward = createRewardContext({
    db: targetDb,
    pointAccountRepo: point.pointAccountRepo,
    pointBalanceUseCase: point.pointBalanceUseCase,
    pointTransactionRepo: point.pointTransactionRepo,
    pointTypeUseCase: point.pointTypeUseCase,
    userUseCase: user.userUseCase,
  });

  for (const event of seedBiliGuardEvents) {
    await reward.rewardUseCase.rewardBiliGuard(event);
  }
}

export async function seedV2(targetDb = db) {
  const passwordHash = await Bun.password.hash(seedDefaultPassword, {
    algorithm: 'bcrypt',
    cost: 12,
  });

  await drizzleSeed(
    targetDb,
    {
      admins,
      pointTypes,
      products,
      productStockMovements,
      users,
    },
    {
      count: userCount,
      seed: seedValue,
    },
  ).refine(funcs => ({
    admins: {
      count: adminCount,
      columns: {
        id: funcs.uuid(),
        uid: funcs.valuesFromArray({ values: adminUids, isUnique: true }),
        username: funcs.valuesFromArray({ values: adminNames, isUnique: true }),
        status: funcs.valuesFromArray({ values: ['active', 'active', 'active', 'banned'] }),
        role: funcs.default({ defaultValue: 'admin' }),
        passwordHash: funcs.default({ defaultValue: passwordHash }),
        lastLoginAt: funcs.date({
          minDate: '2026-01-01',
          maxDate: '2026-05-01',
        }),
        remark: funcs.valuesFromArray({ values: adminRemarks }),
      },
    },
    users: {
      count: userCount,
      columns: {
        id: funcs.uuid(),
        biliUid: funcs.valuesFromArray({ values: biliUids, isUnique: true }),
        username: funcs.valuesFromArray({ values: userNames, isUnique: true }),
        status: funcs.valuesFromArray({
          values: ['active', 'active', 'active', 'active', 'banned'],
        }),
        passwordHash: funcs.default({ defaultValue: passwordHash }),
        phoneEncrypted: funcs.valuesFromArray({ values: userPhones, isUnique: true }),
        emailEncrypted: funcs.valuesFromArray({ values: userEmails, isUnique: true }),
        addressEncrypted: funcs.valuesFromArray({ values: userAddresses }),
        phoneHash: funcs.valuesFromArray({ values: userPhoneHashes, isUnique: true }),
        remark: funcs.valuesFromArray({ values: userRemarks }),
      },
    },
    pointTypes: {
      count: pointTypeData.length,
      columns: {
        id: funcs.uuid(),
        name: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.name),
          isUnique: true,
        }),
        description: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.description),
        }),
        icon: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.icon),
          isUnique: true,
        }),
        status: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.status),
        }),
        sort: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.sort),
          isUnique: true,
        }),
      },
      with: {
        products: productsPerPointType,
      },
    },
    products: {
      count: productNames.length,
      columns: {
        id: funcs.uuid(),
        name: funcs.valuesFromArray({ values: productNames, isUnique: true }),
        description: funcs.valuesFromArray({ values: productDescriptions }),
        cover: funcs.valuesFromArray({ values: productCovers, isUnique: true }),
        detail: funcs.valuesFromArray({ values: productDetails }),
        deliveryContent: funcs.valuesFromArray({ values: productDeliveryContents }),
        price: funcs.valuesFromArray({ values: productPrices }),
        status: funcs.valuesFromArray({ values: ['active', 'active', 'active', 'disabled'] }),
        stock: funcs.valuesFromArray({ values: productStocks }),
        deliveryType: funcs.valuesFromArray({ values: productDeliveryTypes }),
        sort: funcs.valuesFromArray({ values: productSorts, isUnique: true }),
        metadata: funcs.json(),
        deletedAt: false,
      },
      with: {
        productStockMovements: [
          {
            weight: 0.65,
            count: 1,
          },
          {
            weight: 0.35,
            count: 2,
          },
        ],
      },
    },
    productStockMovements: {
      count: stockMovementCount,
      columns: {
        id: funcs.uuid(),
        type: funcs.valuesFromArray({ values: ['adjust', 'adjust', 'consume'] }),
        delta: funcs.valuesFromArray({ values: stockDeltas }),
        stockBefore: funcs.valuesFromArray({ values: stockBefore }),
        stockAfter: funcs.valuesFromArray({ values: stockAfter }),
        sourceType: funcs.default({ defaultValue: 'seed_adjustment' }),
        sourceId: funcs.valuesFromArray({ values: stockSourceIds, isUnique: true }),
        idempotencyKey: funcs.valuesFromArray({ values: stockIdempotencyKeys, isUnique: true }),
        remark: funcs.valuesFromArray({ values: stockRemarks }),
        metadata: funcs.json(),
      },
    },
  }));

  await seedBiliGuardRewardEvents(targetDb);

  return {
    admins: adminCount,
    users: userCount,
    pointTypes: pointTypeData.length,
    rewardRules: Object.keys(seedRewardRuleNames).length,
    pointConversionRules: Object.keys(seedPointConversionRuleNames).length,
    biliEvents: seedBiliGuardEvents.length,
    products: productNames.length,
    productStockMovements: stockMovementCount,
  };
}

if (import.meta.main) {
  try {
    const databaseUrl = Bun.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required to seed database.');
    }

    const result = await seedV2(createDatabase(databaseUrl));

    console.log(
      `Seed completed: ${result.admins} admins, ${result.users} users, ${result.pointTypes} point types, ${result.rewardRules} reward rules, ${result.pointConversionRules} point conversion rules, ${result.biliEvents} bili guard events, ${result.products} products, ${result.productStockMovements} product stock movements.`,
    );
  } catch (e) {
    console.error(e);
  }
}
