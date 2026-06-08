import { parseCliOptions } from './cli';
import { processConfigs } from './config';
import { errorMain, logMain } from './logger';
import { ProcessManager } from './process-manager';
import { SchemaWatcher } from './schema-watcher';

let cliOptions: ReturnType<typeof parseCliOptions>;

try {
  cliOptions = parseCliOptions(Bun.argv.slice(2));
} catch (error) {
  errorMain(error instanceof Error ? error.message : String(error));

  process.exit(1);
}

const enabledProcessConfigs = processConfigs.filter(config => cliOptions.enabled.has(config.id));

if (enabledProcessConfigs.length === 0) {
  errorMain('no processes enabled');
  process.exit(1);
}

const processManager = new ProcessManager(enabledProcessConfigs);

const schemaWatcher = new SchemaWatcher(
  () => {
    void processManager.restartApps();
  },
  () => processManager.isExiting,
);

async function exit(signal: NodeJS.Signals, code = 0) {
  schemaWatcher.close();

  await processManager.exitAll(signal, code);
}

function setupKeyboard() {
  if (!process.stdin.isTTY) return;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', input => {
    if (input === 'r' || input === 'R') {
      void processManager.restartApps();
      return;
    }

    if (input === '\x03') {
      void exit('SIGINT', 0);
      return;
    }

    if (input === '\x04') {
      void exit('SIGTERM', 0);
    }
  });
}

const enabledNames = enabledProcessConfigs.map(config => config.id).join(', ');

logMain(`starting: ${enabledNames}`);

processManager.startAll();
setupKeyboard();

if (processManager.hasEnabledApps) {
  schemaWatcher.start();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void exit(signal, 0);
  });
}

await new Promise(() => {});
