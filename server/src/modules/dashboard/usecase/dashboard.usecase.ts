import type { DashboardOverviewQuery } from '@shared/schema/dashboard';
import { BiliGuardType } from '@shared/schema/reward';
import { type InferInput, ripple } from 'cyrenejs';

import { dashboardRepo } from '../repository';

function createMonthKeys(months: number, start: Date) {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${date.getFullYear()}-${month}`;
  });
}

function buildCountTrend(
  months: number,
  start: Date,
  rows: Array<{ month: string; count: number }>,
) {
  const countByMonth = new Map(rows.map(row => [row.month, row.count]));

  return createMonthKeys(months, start).map(month => ({
    month,
    count: countByMonth.get(month) ?? 0,
  }));
}

function buildBiliGuardTrend(
  months: number,
  start: Date,
  rows: Array<{ month: string; guardType: number; count: number }>,
) {
  const countByMonthAndType = new Map(
    rows.map(row => [`${row.month}:${row.guardType}`, row.count] as const),
  );

  return createMonthKeys(months, start).map(month => ({
    month,
    zongdu: countByMonthAndType.get(`${month}:${BiliGuardType.Zongdu}`) ?? 0,
    tidu: countByMonthAndType.get(`${month}:${BiliGuardType.Tidu}`) ?? 0,
    jianzhang: countByMonthAndType.get(`${month}:${BiliGuardType.Jianzhang}`) ?? 0,
    total:
      (countByMonthAndType.get(`${month}:${BiliGuardType.Zongdu}`) ?? 0) +
      (countByMonthAndType.get(`${month}:${BiliGuardType.Tidu}`) ?? 0) +
      (countByMonthAndType.get(`${month}:${BiliGuardType.Jianzhang}`) ?? 0),
  }));
}

export const dashboardUseCase = ripple(
  {
    dashboardRepo,
  },
  ({ dashboardRepo }) => ({
    async overview(query: DashboardOverviewQuery = {}) {
      const months = query.months ?? 12;
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const statsStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

      const [
        currentMonthBiliGuardEvents,
        currentMonthOrders,
        pendingOrders,
        currentMonthGrantedPoints,
        monthlyBiliGuardStats,
        monthlyOrderStats,
        biliGuardStatusStats,
        unboundBiliGuardEvents,
        recentOrders,
        recentFailedBiliGuardEvents,
      ] = await Promise.all([
        dashboardRepo.countBiliGuardEvents(currentMonthStart, nextMonthStart),
        dashboardRepo.countOrders(currentMonthStart, nextMonthStart),
        dashboardRepo.countPendingOrders(),
        dashboardRepo.sumGrantedPoints(currentMonthStart, nextMonthStart),
        dashboardRepo.listMonthlyBiliGuardStats(statsStart),
        dashboardRepo.listMonthlyOrderStats(statsStart),
        dashboardRepo.countBiliGuardEventsByStatus(),
        dashboardRepo.countUnboundBiliGuardEvents(),
        dashboardRepo.listRecentOrders(10),
        dashboardRepo.listRecentFailedBiliGuardEvents(10),
      ]);

      return {
        summary: {
          currentMonthBiliGuardEvents,
          currentMonthOrders,
          pendingOrders,
          currentMonthGrantedPoints,
          unboundBiliGuardEvents,
        },
        trends: {
          biliGuardEvents: buildBiliGuardTrend(months, statsStart, monthlyBiliGuardStats),
          orders: buildCountTrend(months, statsStart, monthlyOrderStats),
        },
        biliGuardStatusStats,
        recentOrders,
        recentFailedBiliGuardEvents,
      };
    },
  }),
  { debugName: 'DashboardUseCase' },
);

export type DashboardUseCase = InferInput<typeof dashboardUseCase>;
