import { ripple } from 'cyrenejs';

import { Database } from '#context/tokens';

import { DashboardRepository } from './repository';
import { DashboardUseCase } from './usecase';

export const dashboardRepo = ripple({ db: Database }, ({ db }) => new DashboardRepository(db), {
  debugName: 'DashboardRepository',
});
export const dashboardUseCase = ripple(
  { dashboardRepo },
  ({ dashboardRepo }) => new DashboardUseCase(dashboardRepo),
  { debugName: 'DashboardUseCase' },
);
