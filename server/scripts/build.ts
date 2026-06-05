import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLogger } from 'vite-plus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function r(...paths: string[]) {
  return resolve(__dirname, ...paths);
}

const logger = createLogger('info');
const reset = '\u001B[0m';
const cyan = Bun.color('cyan', 'ansi') ?? '';
const green = Bun.color('green', 'ansi') ?? '';

function color(text: string, ansi: string) {
  return ansi ? `${ansi}${text}${reset}` : text;
}

async function buildApp(name: string) {
  logger.info(`${color('Building', cyan)} ${name}...`);

  await Bun.build({
    entrypoints: [r(`../src/apps/${name}/index.ts`)],
    minify: true,
    bytecode: true,
    compile: {
      outfile: r(`../dist/${name}`),
    },
  });
}

logger.info(`${color('Building', cyan)} apps...`);

await buildApp('admin');
await buildApp('user');
await buildApp('event');

logger.info(color('Done.', green));
