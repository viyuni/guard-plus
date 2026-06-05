import type { DbClient } from '#db';

import { DashboardRepository } from './repository';
import { DashboardUseCase } from './usecase';

export function createDashboardContext({ db }: { db: DbClient }) {
  const dashboardRepo = new DashboardRepository(db);
  const dashboardUseCase = new DashboardUseCase(dashboardRepo);

  return {
    dashboardRepo,
    dashboardUseCase,
  };
}
