import { resolve } from 'node:path';

export const serverDir = resolve(import.meta.dir, '../..');
export const workspaceDir = resolve(serverDir, '..');
export const schemaDir = resolve(workspaceDir, 'packages/schema');
