import type { DevProcess, ProcessId } from './types';

export const processConfigs = [
  {
    id: 'admin',
    name: 'AdminServer',
    command: [
      'bun',
      '--env-file=.env',
      '--no-orphans',
      '--no-clear-screen',
      '--watch',
      './src/apps/admin/index.ts',
    ],
    color: Bun.color('#A78BFA', 'ansi') ?? '',
    kind: 'app',
    cwd: 'server',
  },
  {
    id: 'user',
    name: 'UserServer',
    command: [
      'bun',
      '--env-file=.env',
      '--no-orphans',
      '--no-clear-screen',
      '--watch',
      './src/apps/user/index.ts',
    ],
    color: Bun.color('#E6CC77', 'ansi') ?? '',
    kind: 'app',
    cwd: 'server',
  },
  {
    id: 'event',
    name: 'EventServer',
    command: [
      'bun',
      '--env-file=.env',
      '--no-orphans',
      '--no-clear-screen',
      './src/apps/event/index.ts',
    ],
    color: Bun.color('#D9739F', 'ansi') ?? '',
    kind: 'app',
    cwd: 'server',
  },
  {
    id: 'types',
    name: 'Types',
    command: ['vp', 'pack', '--watch'],
    color: Bun.color('#5EAAB5', 'ansi') ?? '',
    kind: 'service',
    cwd: 'server',
  },
] satisfies DevProcess[];

export const processIds = new Set<ProcessId>(processConfigs.map(config => config.id));
