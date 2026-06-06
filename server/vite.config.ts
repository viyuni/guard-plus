import { createCommand } from '@viyuni/vpp';
import { defineConfig } from 'vite-plus';

const bun = createCommand('bun');
const bunEnv = bun.with('--bun --env-file=.env');
const bunTest = bun.with('--bun --env-file=.env.test');
const dev = bunEnv.with('--bun --no-clear-screen --watch');

const inputs = {
  admin: './src/apps/admin/index.ts',
  user: './src/apps/user/index.ts',
  event: './src/apps/event/index.ts',
} as const;

export default defineConfig({
  pack: {
    entry: {
      eden: './src/eden.ts',
    },
    dts: {
      emitDtsOnly: true,
    },
  },
  run: {
    tasks: {
      dev: {
        cache: false,
        command: 'bun scripts/dev.ts',
      },
      'dev:admin': {
        cache: false,
        command: dev(inputs.admin),
      },
      'dev:user': {
        cache: false,
        command: dev(inputs.user),
      },
      'dev:event': {
        cache: false,
        command: dev(inputs.event),
      },
      build: {
        command: 'bun scripts/build.ts',
      },
      dts: {
        command: 'vp pack',
      },
      typecheck: {
        command: 'tsgo --build',
      },
      check: {
        command: 'vp check',
      },
      test: {
        command: bunTest('test'),
      },
      'db:generate': {
        command: bunEnv('drizzle-kit generate'),
      },
      'db:push': {
        cache: false,
        command: bunEnv('drizzle-kit push'),
      },
      'db:push:test': {
        cache: false,
        command: bunTest('drizzle-kit push'),
      },
      'db:seed': {
        cache: false,
        command: bunEnv('./src/db/seed.ts'),
        dependsOn: ['db:push'],
      },
      'db:studio': {
        cache: false,
        command: bunEnv('drizzle-kit studio'),
      },
      'docker-compose': {
        cache: false,
        command: 'docker compose up -d',
      },
    },
  },
});
