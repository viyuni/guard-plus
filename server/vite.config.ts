import { createCommand } from '@viyuni/vpp';
import { defineConfig } from 'vite-plus';

const bun = createCommand('bun');
const bunEnv = bun.with('--bun --env-file=.env');
const bunTest = bun.with('--bun --env-file=.env.test');
const dev = bunEnv.with('--bun --no-clear-screen --watch');

const inputs = {
  admin: './src/apps/admin/index.ts',
  dbPush: [
    'drizzle/**',
    'drizzle.config.ts',
    'src/db/schema/**',
    'src/db/relations.ts',
    'package.json',
    'bunfig.toml',
  ],
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
    clean: false,
  },
  run: {
    tasks: {
      dev: {
        cache: false,
        command: 'bun scripts/dev/index.ts',
        dependsOn: ['db:push'],
      },
      'dev:admin': {
        cache: false,
        command: dev(inputs.admin),
        dependsOn: ['db:push'],
      },
      'dev:user': {
        cache: false,
        command: dev(inputs.user),
        dependsOn: ['db:push'],
      },
      'dev:event': {
        cache: false,
        command: dev(inputs.event),
        dependsOn: ['db:push'],
      },
      build: {
        command: 'bun scripts/build.ts',
      },
      'build:types': {
        cache: true,
        command: 'vp pack',
        input: [{ auto: true }, '!**/*.tsbuildinfo', '!dist/**'],
        output: ['dist/**'],
      },
      typecheck: {
        cache: true,
        command: 'tsgo --build',
        input: [{ auto: true }, '!**/*.tsbuildinfo'],
      },
      check: {
        command: 'vp check',
      },
      test: {
        command: [
          'docker compose -f compose.test.yml down',
          'docker compose -f compose.test.yml up -d --wait',
          'vpr db:push:test',
          bunTest('test'),
        ],
      },
      'db:generate': {
        command: bunEnv('drizzle-kit generate'),
        input: [...inputs.dbPush, '.env'],
      },
      'db:push': {
        cache: true,
        command: bunEnv('drizzle-kit push'),
        input: [...inputs.dbPush, '.env'],
      },
      'db:push:test': {
        cache: true,
        command: bunTest('drizzle-kit push'),
        input: [...inputs.dbPush, '.env.test'],
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
      'infra:up': {
        cache: false,
        command: ['docker compose -f compose.infra.yml up -d', 'vpr db:push', 'vpr db:seed'],
      },
      'infra:down': {
        cache: false,
        command: 'docker compose -f compose.infra.yml down',
      },
      'infra:logs': {
        cache: false,
        command: 'docker compose -f compose.infra.yml logs -f',
      },
      'infra:reset': {
        cache: false,
        command: ['vpr infra:down', 'vpr infra:up'],
      },
      deploy: {
        cache: false,
        command:
          'docker compose --env-file .env.prod -f compose.prod.yml up -d --build --force-recreate',
      },
    },
  },
});
