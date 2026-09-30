import { AdminJwtSecret } from '#config';
import { createAuth } from '#modules/auth';

export const Auth = createAuth('AdminTokenUseCase', { JwtSecret: AdminJwtSecret });
