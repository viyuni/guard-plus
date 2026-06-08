import { expect, it } from 'bun:test';

import { and, count, eq } from 'drizzle-orm';

import { orders, pointTransactions, productStockMovements } from '#db/schema';
import { OrderIdempotencyKey } from '#modules/order';
import { PointIdempotencyKey } from '#modules/point';
import { ProductUnavailableError, StockIdempotencyKey } from '#modules/product';
import { countFulfilled, countRejected, runConcurrent } from '#test-helpers/concurrency';
import {
  createDeps,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  expectSeeded,
  grantPoints,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedProduct,
  seedUser,
} from '#test-helpers/concurrency-fixtures';

installConcurrencyTestHooks();

describeWithDatabase('订单真实数据库并发保护', () => {
  it('监修中商品不允许创建订单', async () => {
    const prefix = newBatch('order_product_reviewing');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const { orderUseCase, productUseCase } = createDeps();
    const product = expectSeeded(
      await productUseCase.create({
        name: `${prefix}_product`,
        pointTypeId: pointType.id,
        price: 1,
        status: 'reviewing',
        stock: 1,
      }),
      'seed reviewing product failed',
    );

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 1,
      nonce: `${prefix}_grant_points`,
    });

    await expectRejectsInstanceOf(
      orderUseCase.create(user.id, {
        productId: product.id,
        nonce: `${prefix}_nonce`,
      }),
      ProductUnavailableError,
    );

    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(and(eq(orders.userId, user.id), eq(orders.productId, product.id)));
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });

    expect(orderRows?.total).toBe(0);
    expect(account?.balance).toBe(1);
    expect(currentProduct?.stock).toBe(1);
  });

  it('订单创建不会并发超扣库存或积分', async () => {
    const prefix = newBatch('order_stock');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 3,
    });

    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 3,
      nonce: `${prefix}_grant_points`,
    });

    const results = await runConcurrent(10, index =>
      orderUseCase.create(user.id, {
        productId: product.id,
        nonce: `${prefix}_${index}`,
      }),
    );

    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(and(eq(orders.userId, user.id), eq(orders.productId, product.id)));

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(currentProduct?.stock).toBe(0);
    expect(account?.balance).toBe(0);
    expect(orderRows?.total).toBe(3);
  });

  it('订单创建相同 nonce 不会重复创建或重复扣减', async () => {
    const prefix = newBatch('order_idempotency');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 5,
    });

    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 5,
      nonce: `${prefix}_grant_points`,
    });

    const results = await runConcurrent(5, () =>
      orderUseCase.create(user.id, {
        productId: product.id,
        nonce: `${prefix}_same_nonce`,
      }),
    );
    const fulfilledOrder = expectSeeded(
      results.find(result => result.status === 'fulfilled')?.value,
      'order create failed',
    );

    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(
        eq(
          orders.idempotencyKey,
          OrderIdempotencyKey.create({
            nonce: `${prefix}_same_nonce`,
          }),
        ),
      );
    const [consumeRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.orderConsume({ orderId: fulfilledOrder.order.id }),
        ),
      );
    const [stockRows] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          StockIdempotencyKey.orderConsume({ orderId: fulfilledOrder.order.id }),
        ),
      );

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(currentProduct?.stock).toBe(4);
    expect(account?.balance).toBe(4);
    expect(orderRows?.total).toBe(1);
    expect(consumeRows?.total).toBe(1);
    expect(stockRows?.total).toBe(1);
  });

  it('商品不在可兑换时间范围内时不允许创建订单', async () => {
    const prefix = newBatch('order_product_time_range');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 2,
      nonce: `${prefix}_grant_points`,
    });

    const futureProduct = await seedProduct({
      name: `${prefix}_future_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
      startAt: new Date(Date.now() + 60_000),
    });
    const expiredProduct = await seedProduct({
      name: `${prefix}_expired_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
      endAt: new Date(Date.now() - 60_000),
    });

    await expectRejectsInstanceOf(
      orderUseCase.create(user.id, {
        productId: futureProduct.id,
        nonce: `${prefix}_future_nonce`,
      }),
      ProductUnavailableError,
    );
    await expectRejectsInstanceOf(
      orderUseCase.create(user.id, {
        productId: expiredProduct.id,
        nonce: `${prefix}_expired_nonce`,
      }),
      ProductUnavailableError,
    );

    const [orderRows] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.userId, user.id));

    expect(orderRows?.total).toBe(0);
  });

  it('订单并发退款只返还一次积分和库存', async () => {
    const prefix = newBatch('order_refund');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });
    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 1,
      nonce: `${prefix}_grant_points`,
    });

    const created = await orderUseCase.create(user.id, {
      productId: product.id,
      nonce: `${prefix}_create`,
    });
    const results = await runConcurrent(2, () =>
      orderUseCase.refund(created.order.id, {
        reason: '并发退款测试',
      }),
    );

    const currentOrder = await db.query.orders.findFirst({ where: { id: created.order.id } });
    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [refundRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.orderRefund({ orderId: created.order.id }),
        ),
      );
    const [restoreRows] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          StockIdempotencyKey.orderRestore({ orderId: created.order.id }),
        ),
      );

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(1);
    expect(currentOrder?.status).toBe('refunded');
    expect(currentProduct?.stock).toBe(1);
    expect(account?.balance).toBe(1);
    expect(refundRows?.total).toBe(1);
    expect(restoreRows?.total).toBe(1);
  });

  it('完成与退款并发时退款状态不会被完成操作覆盖', async () => {
    const prefix = newBatch('order_complete_refund');
    const pointType = await seedPointType(`${prefix}_point`);
    const user = await seedUser(`${prefix}_user`);
    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });
    const { orderUseCase } = createDeps();

    await grantPoints({
      adminId: `${prefix}_admin`,
      userId: user.id,
      pointTypeId: pointType.id,
      delta: 1,
      nonce: `${prefix}_grant_points`,
    });

    const created = await orderUseCase.create(user.id, {
      productId: product.id,
      nonce: `${prefix}_create`,
    });
    const results = await Promise.allSettled([
      orderUseCase.complete(created.order.id),
      orderUseCase.refund(created.order.id, {
        reason: '完成退款竞态测试',
      }),
    ]);

    const currentOrder = await db.query.orders.findFirst({ where: { id: created.order.id } });
    const currentProduct = await db.query.products.findFirst({ where: { id: product.id } });
    const account = await db.query.pointAccounts.findFirst({
      where: { userId: user.id, pointTypeId: pointType.id },
    });
    const [refundRows] = await db
      .select({ total: count() })
      .from(pointTransactions)
      .where(
        eq(
          pointTransactions.idempotencyKey,
          PointIdempotencyKey.orderRefund({ orderId: created.order.id }),
        ),
      );
    const [restoreRows] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          StockIdempotencyKey.orderRestore({ orderId: created.order.id }),
        ),
      );

    expect(countFulfilled(results)).toBeGreaterThanOrEqual(1);
    expect(currentOrder?.status).toBe('refunded');
    expect(currentProduct?.stock).toBe(1);
    expect(account?.balance).toBe(1);
    expect(refundRows?.total).toBe(1);
    expect(restoreRows?.total).toBe(1);
  });
});
