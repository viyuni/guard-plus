import type { Admin } from '#db/schema';

import { AdminDisabledError, AdminNotFoundError } from './errors';

export type AvailableAdmin = Admin & {
  status: 'active';
};

export class AdminPolicy {
  static isAvailable(admin: Admin | null | undefined): admin is AvailableAdmin {
    return admin?.status === 'active';
  }

  static assertExists(admin: Admin | null | undefined): asserts admin is Admin {
    if (!admin) {
      throw new AdminNotFoundError();
    }
  }

  static assertAvailable(admin: Admin | null | undefined): asserts admin is AvailableAdmin {
    if (!AdminPolicy.isAvailable(admin)) {
      throw new AdminDisabledError();
    }
  }

  static assertAvailableExists(admin: Admin | null | undefined): asserts admin is AvailableAdmin {
    AdminPolicy.assertExists(admin);
    AdminPolicy.assertAvailable(admin);
  }
}
