import { processIds } from './config';
import type { CliOptions, ProcessId } from './types';

function printHelp() {
  console.log(
    `
Usage:
  bun scripts/dev/index.ts [processes...] [options]

Processes:
  admin    Start AdminServer
  user     Start UserServer
  event    Start EventServer
  types    Start vp pack --watch

Options:
  --only=<list>       Only start selected processes
  --exclude=<list>    Exclude selected processes
  --no-admin          Disable AdminServer
  --no-user           Disable UserServer
  --no-event          Disable EventServer
  --no-types          Disable type generation
  -h, --help          Show this help

Examples:
  bun scripts/dev/index.ts
  bun scripts/dev/index.ts admin user
  bun scripts/dev/index.ts admin user types
  bun scripts/dev/index.ts --only=admin,user,types
  bun scripts/dev/index.ts --exclude=event
  bun scripts/dev/index.ts --no-types
`.trim(),
  );
}

function isProcessId(value: string): value is ProcessId {
  return processIds.has(value as ProcessId);
}

function createUnknownProcessError(value: string) {
  return new Error(
    `Unknown process "${value}". Available processes: ${[...processIds].join(', ')}`,
  );
}

function parseProcessList(value: string) {
  const result = new Set<ProcessId>();

  for (const item of value.split(',')) {
    const id = item.trim().toLowerCase();

    if (!id) continue;

    if (!isProcessId(id)) {
      throw createUnknownProcessError(item);
    }

    result.add(id);
  }

  return result;
}

export function parseCliOptions(args: string[]): CliOptions {
  let enabled = new Set<ProcessId>(processIds);
  const positional: ProcessId[] = [];

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg.startsWith('--only=')) {
      enabled = parseProcessList(arg.slice('--only='.length));

      continue;
    }

    if (arg.startsWith('--exclude=')) {
      const excluded = parseProcessList(arg.slice('--exclude='.length));

      for (const id of excluded) {
        enabled.delete(id);
      }

      continue;
    }

    if (arg.startsWith('--no-')) {
      const id = arg.slice('--no-'.length).trim().toLowerCase();

      if (!isProcessId(id)) {
        throw createUnknownProcessError(id);
      }

      enabled.delete(id);
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option "${arg}"`);
    }

    const id = arg.trim().toLowerCase();

    if (!isProcessId(id)) {
      throw createUnknownProcessError(arg);
    }

    positional.push(id);
  }

  if (positional.length > 0) {
    enabled = new Set(positional);
  }

  return {
    enabled,
  };
}
