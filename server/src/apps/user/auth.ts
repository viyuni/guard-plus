import { UserJwtSecret } from '#config';
import { createAuth } from '#modules/auth';

export const Auth = createAuth('UserTokenUseCase', { JwtSecret: UserJwtSecret });
