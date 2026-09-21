import type { Admin } from '#infrastructure/db/schema';
import { assertPresent } from '#shared';

import { AdminDisabledError, AdminNotFoundError } from './errors';

export type AvailableAdmin = Admin & {
  status: 'active';
};

export function isAdminAvailable(admin: Admin | null | undefined): admin is AvailableAdmin {
  return admin?.status === 'active';
}

export function assertAdminExists(admin: Admin | null | undefined): asserts admin is Admin {
  assertPresent(admin, () => new AdminNotFoundError());
}

export function assertAdminAvailable(
  admin: Admin | null | undefined,
): asserts admin is AvailableAdmin {
  if (!isAdminAvailable(admin)) {
    throw new AdminDisabledError();
  }
}

export function assertAdminAvailableExists(
  admin: Admin | null | undefined,
): asserts admin is AvailableAdmin {
  assertAdminExists(admin);
  assertAdminAvailable(admin);
}
