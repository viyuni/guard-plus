import { and, count, desc, eq, gte, isNull, lt, sql, sum } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import { biliEvents, orders, pointTransactions, users } from '#db/schema';

export class DashboardRepository {
  constructor(private readonly db: DbExecutor) {}

  async countBiliGuardEvents(start: Date, end: Date) {
    const [row] = await this.db
      .select({
        count: count(),
      })
      .from(biliEvents)
      .where(
        and(
          eq(biliEvents.eventType, 'biliGuard'),
          gte(biliEvents.occurredAt, start),
          lt(biliEvents.occurredAt, end),
        ),
      );

    return row?.count ?? 0;
  }

  async countOrders(start: Date, end: Date) {
    const [row] = await this.db
      .select({
        count: count(),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)));

    return row?.count ?? 0;
  }

  async countPendingOrders() {
    const [row] = await this.db
      .select({
        count: count(),
      })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    return row?.count ?? 0;
  }

  async sumGrantedPoints(start: Date, end: Date) {
    const [row] = await this.db
      .select({
        total: sum(pointTransactions.delta),
      })
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.type, 'grant'),
          gte(pointTransactions.createdAt, start),
          lt(pointTransactions.createdAt, end),
        ),
      );

    return Number(row?.total ?? 0);
  }

  async listMonthlyBiliGuardStats(start: Date) {
    return await this.db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${biliEvents.occurredAt}), 'YYYY-MM')`,
        guardType: sql<number>`(${biliEvents.eventSnapshot}->>'guardType')::int`,
        count: count(),
      })
      .from(biliEvents)
      .where(and(eq(biliEvents.eventType, 'biliGuard'), gte(biliEvents.occurredAt, start)))
      .groupBy(
        sql`date_trunc('month', ${biliEvents.occurredAt})`,
        sql`(${biliEvents.eventSnapshot}->>'guardType')::int`,
      )
      .orderBy(sql`date_trunc('month', ${biliEvents.occurredAt})`);
  }

  async listMonthlyOrderStats(start: Date) {
    return await this.db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`,
        count: count(),
      })
      .from(orders)
      .where(gte(orders.createdAt, start))
      .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('month', ${orders.createdAt})`);
  }

  async countBiliGuardEventsByStatus() {
    return await this.db
      .select({
        status: biliEvents.status,
        count: count(),
      })
      .from(biliEvents)
      .where(eq(biliEvents.eventType, 'biliGuard'))
      .groupBy(biliEvents.status);
  }

  async countUnboundBiliGuardEvents() {
    const [row] = await this.db
      .select({
        count: count(),
      })
      .from(biliEvents)
      .where(and(eq(biliEvents.eventType, 'biliGuard'), isNull(biliEvents.userId)));

    return row?.count ?? 0;
  }

  async listRecentOrders(limit = 10) {
    return await this.db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        userId: orders.userId,
        username: users.username,
        biliUid: users.biliUid,
        productName: orders.productNameSnapshot,
        pointTypeName: orders.pointTypeNameSnapshot,
        price: orders.price,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async listRecentFailedBiliGuardEvents(limit = 10) {
    return await this.db.query.biliEvents.findMany({
      where: {
        eventType: 'biliGuard',
        status: 'failed',
      },
      columns: {
        id: true,
        biliEventId: true,
        biliUid: true,
        occurredAt: true,
        lastErrorCode: true,
        lastErrorMessage: true,
      },
      orderBy: {
        occurredAt: 'desc',
        createdAt: 'desc',
      },
      limit,
    });
  }
}
