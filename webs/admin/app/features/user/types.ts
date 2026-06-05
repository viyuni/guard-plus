import type { Treaty } from '@elysia/eden';

import type { AdminApi } from '~/plugins/api';

export type UserListPage = Treaty.Data<AdminApi['users']['get']>;
export type User = NonNullable<UserListPage>['items'][number];
