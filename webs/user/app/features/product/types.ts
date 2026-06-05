import type { Treaty } from '@elysia/eden';

import type { UserApi } from '~/plugins/api';

export type Product = Treaty.Data<UserApi['products']['get']>['items'][number];
