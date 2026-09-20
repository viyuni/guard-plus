import { expect, it } from 'bun:test';

import { count, eq } from 'drizzle-orm';

import { productStockMovements } from '#db/schema';
import { countFulfilled, countRejected, runConcurrent } from '#test-helpers/concurrency';
import {
  createDeps,
  db,
  describeWithDatabase,
  expectRejectsInstanceOf,
  expectSeeded,
  installConcurrencyTestHooks,
  newBatch,
  seedPointType,
  seedProduct,
} from '#test-helpers/concurrency-fixtures';

import { StockIdempotencyKey } from '..';
import { ProductCodeExistsError, StockAmountInvalidError } from '../domain';

installConcurrencyTestHooks();

describeWithDatabase('产品库存真实数据库并发保护', () => {
  it('兑换商城列表会展示监修中商品', async () => {
    const prefix = newBatch('product_reviewing_list');
    const pointType = await seedPointType(`${prefix}_point`);
    const { ProductUseCase } = await createDeps();

    const product = expectSeeded(
      await ProductUseCase.create({
        name: `${prefix}_product`,
        pointTypeId: pointType.id,
        price: 1,
        status: 'reviewing',
        stock: 1,
      }),
      'seed reviewing product failed',
    );

    const page = await ProductUseCase.pageRedeem({
      page: 1,
      pageSize: 10,
    });

    expect(page.items.some(item => item.id === product.id && item.status === 'reviewing')).toBe(
      true,
    );
  });

  it('库存增加后超出 PostgreSQL integer 范围时返回数量错误', async () => {
    const prefix = newBatch('product_stock_overflow');
    const pointType = await seedPointType(`${prefix}_point`);

    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 2_147_483_647,
    });

    const { ProductUseCase } = await createDeps();

    await expectRejectsInstanceOf(
      ProductUseCase.adminAdjustStock(product.id, `${prefix}_admin`, {
        delta: 1,
        nonce: `${prefix}_overflow`,
      }),
      StockAmountInvalidError,
    );

    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(current?.stock).toBe(2_147_483_647);
  });

  it('商品创建允许重复名称', async () => {
    const prefix = newBatch('product_name');
    const pointType = await seedPointType(`${prefix}_point`);
    const { ProductUseCase } = await createDeps();

    const first = await ProductUseCase.create({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const second = await ProductUseCase.create({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    if (!first || !second) {
      throw new Error('同名商品创建失败');
    }

    expect(second.name).toBe(first.name);
    expect(second.id).not.toBe(first.id);
  });

  it('商品创建会拒绝重复编码', async () => {
    const prefix = newBatch('product_code');
    const pointType = await seedPointType(`${prefix}_point`);
    const { ProductUseCase } = await createDeps();
    const code = `${prefix}_code`;

    await ProductUseCase.create({
      code,
      name: `${prefix}_first_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    await expectRejectsInstanceOf(
      ProductUseCase.create({
        code,
        name: `${prefix}_second_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 1,
      }),
      ProductCodeExistsError,
    );
  });

  it('商品编码唯一索引会阻止并发重复创建', async () => {
    const prefix = newBatch('product_code_concurrency');
    const pointType = await seedPointType(`${prefix}_point`);
    const { ProductUseCase } = await createDeps();
    const code = `${prefix}_code`;

    const results = await runConcurrent(5, index =>
      ProductUseCase.create({
        code,
        name: `${prefix}_product_${index}`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 1,
      }),
    );

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
  });

  it('商品更新允许重复名称', async () => {
    const prefix = newBatch('product_update_name');
    const pointType = await seedPointType(`${prefix}_point`);

    const first = await seedProduct({
      name: `${prefix}_first_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const second = await seedProduct({
      name: `${prefix}_second_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const { ProductUseCase } = await createDeps();

    const updated = await ProductUseCase.update(second.id, {
      name: first.name,
    });

    expect(updated.name).toBe(first.name);
  });

  it('商品更新会拒绝重复编码', async () => {
    const prefix = newBatch('product_update_code');
    const pointType = await seedPointType(`${prefix}_point`);

    const first = await seedProduct({
      name: `${prefix}_first_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const second = await seedProduct({
      name: `${prefix}_second_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    await expectRejectsInstanceOf(
      (await createDeps()).ProductUseCase.update(second.id, { code: first.code }),
      ProductCodeExistsError,
    );
  });

  it('商品更新保持原名称时允许保存', async () => {
    const prefix = newBatch('product_keep_name');
    const pointType = await seedPointType(`${prefix}_point`);

    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const { ProductUseCase } = await createDeps();

    const updated = await ProductUseCase.update(product.id, {
      name: product.name,
      price: 2,
    });

    expect(updated.name).toBe(product.name);
    expect(updated.price).toBe(2);
  });

  it('商品删除后可复用编码', async () => {
    const prefix = newBatch('product_remove_code');
    const pointType = await seedPointType(`${prefix}_point`);

    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const { ProductUseCase } = await createDeps();

    await ProductUseCase.remove(product.id);

    const recreated = await ProductUseCase.create({
      code: product.code,
      name: `${prefix}_recreated_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 1,
    });

    const page = await ProductUseCase.pageManage({
      keyword: product.code,
      page: 1,
      pageSize: 10,
    });

    expect(recreated?.id).toBeDefined();
    expect(page.items.some(item => item.id === product.id)).toBe(false);
    expect(page.items.some(item => item.id === recreated?.id)).toBe(true);
  });

  it('管理端商品列表支持按编码搜索', async () => {
    const prefix = newBatch('product_code_search');
    const pointType = await seedPointType(`${prefix}_point`);

    const product = expectSeeded(
      await (
        await createDeps()
      ).ProductUseCase.create({
        code: `${prefix}_SEARCH_CODE`,
        name: `${prefix}_product`,
        pointTypeId: pointType.id,
        price: 1,
        stock: 1,
      }),
      'seed searchable product failed',
    );

    const page = await (
      await createDeps()
    ).ProductUseCase.pageManage({
      keyword: 'search_code',
      page: 1,
      pageSize: 10,
    });

    expect(page.items.some(item => item.id === product.id)).toBe(true);
  });

  it('库存扣减不会并发超扣', async () => {
    const prefix = newBatch('product_stock');
    const pointType = await seedPointType(`${prefix}_point`);

    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 3,
    });

    const { ProductUseCase } = await createDeps();

    const results = await runConcurrent(10, index =>
      ProductUseCase.adminAdjustStock(product.id, `${prefix}_admin_${index}`, {
        delta: -1,
        nonce: `${prefix}_deduct_${index}`,
      }),
    );

    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(3);
    expect(countRejected(results)).toBe(7);
    expect(current?.stock).toBe(0);
  });

  it('库存变动记录按幂等键保持唯一', async () => {
    const prefix = newBatch('product_movement');
    const pointType = await seedPointType(`${prefix}_point`);

    const product = await seedProduct({
      name: `${prefix}_product`,
      pointTypeId: pointType.id,
      price: 1,
      stock: 0,
    });

    const { ProductUseCase } = await createDeps();

    const results = await runConcurrent(5, () =>
      ProductUseCase.adminAdjustStock(product.id, `${prefix}_admin`, {
        delta: 1,
        nonce: `${prefix}_same_key`,
      }),
    );

    const [row] = await db
      .select({ total: count() })
      .from(productStockMovements)
      .where(
        eq(
          productStockMovements.idempotencyKey,
          StockIdempotencyKey.adminAdjust({
            productId: product.id,
            adminId: `${prefix}_admin`,
            nonce: `${prefix}_same_key`,
          }),
        ),
      );

    const current = await db.query.products.findFirst({ where: { id: product.id } });

    expect(countFulfilled(results)).toBe(1);
    expect(countRejected(results)).toBe(4);
    expect(row?.total).toBe(1);
    expect(current?.stock).toBe(1);
  });
});
