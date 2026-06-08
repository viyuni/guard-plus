import { watch, type FSWatcher } from 'node:fs';

import { errorMain, logMain } from './logger';
import { schemaDir } from './paths';

export class SchemaWatcher {
  private watcher: FSWatcher | undefined;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly onChange: () => void,
    private readonly isExiting: () => boolean,
  ) {}

  start() {
    if (this.watcher) return;

    this.watcher = watch(
      schemaDir,
      {
        recursive: true,
      },
      (_event, filename) => {
        if (!filename || this.isExiting()) {
          return;
        }

        const normalized = this.normalizePath(filename.toString());

        if (this.shouldIgnorePath(normalized)) {
          return;
        }

        this.scheduleRestart(normalized);
      },
    );

    this.watcher.on('error', error => {
      if (!this.isExiting()) {
        errorMain('schema watcher failed', error);
      }
    });

    logMain('watching packages/schema');
  }

  close() {
    clearTimeout(this.restartTimer);
    this.restartTimer = undefined;

    this.watcher?.close();
    this.watcher = undefined;
  }

  private normalizePath(path: string) {
    return path.replaceAll('\\', '/');
  }

  private shouldIgnorePath(filename: string) {
    const path = this.normalizePath(filename);

    return (
      path.includes('node_modules/') ||
      path.includes('.git/') ||
      path.includes('dist/') ||
      path.includes('generated/') ||
      path.endsWith('.d.ts') ||
      path.endsWith('.d.ts.map') ||
      path.endsWith('.tsbuildinfo') ||
      path.endsWith('.log')
    );
  }

  private scheduleRestart(filename: string) {
    if (this.isExiting()) return;

    logMain(`schema changed: ${filename}`);

    clearTimeout(this.restartTimer);

    this.restartTimer = setTimeout(() => {
      this.restartTimer = undefined;

      this.onChange();
    }, 200);
  }
}
