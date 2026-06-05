import { logger } from '#utils/logger';

import { app } from './server';

app.compile().listen({}, logger.printUrls);
