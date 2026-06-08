import { errorMain, logMain } from './logger';
import { pipeLines } from './output';
import { serverDir, workspaceDir } from './paths';
import type { DevProcess, ManagedProcess } from './types';

export class ProcessManager {
  private processes: ManagedProcess[] = [];
  private restarting = false;
  private exiting = false;
  private serviceStartTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly configs: DevProcess[]) {}

  get isExiting() {
    return this.exiting;
  }

  get hasEnabledApps() {
    return this.configs.some(config => config.kind === 'app');
  }

  startAll() {
    const appConfigs = this.configs.filter(config => config.kind === 'app');

    const serviceConfigs = this.configs.filter(config => config.kind === 'service');

    // 优先启动三个服务
    this.registerProcesses(appConfigs.map(config => this.startProcess(config)));

    // Types 的首次 pack 较重，延迟启动，避免争抢启动资源
    if (serviceConfigs.length > 0) {
      this.serviceStartTimer = setTimeout(() => {
        this.serviceStartTimer = undefined;

        if (this.exiting) return;

        this.registerProcesses(serviceConfigs.map(config => this.startProcess(config)));
      }, 1000);
    }
  }

  async exitAll(signal: NodeJS.Signals = 'SIGTERM', code = 0) {
    if (this.exiting) return;

    this.exiting = true;

    clearTimeout(this.serviceStartTimer);
    this.serviceStartTimer = undefined;

    await this.stopAll(signal);

    process.exit(code);
  }

  async restartApps() {
    if (this.restarting || this.exiting || !this.hasEnabledApps) {
      return;
    }

    this.restarting = true;

    try {
      logMain('restarting apps...');

      await this.stopApps('SIGTERM');

      if (this.exiting) return;

      this.startApps();

      logMain('apps restarted');
    } finally {
      this.restarting = false;
    }
  }

  private getProcessCwd(config: DevProcess) {
    return config.cwd === 'workspace' ? workspaceDir : serverDir;
  }

  private startProcess(config: DevProcess): ManagedProcess {
    const proc = Bun.spawn(config.command, {
      cwd: this.getProcessCwd(config),
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });

    void pipeLines(proc.stdout, config.name, config.color);

    void pipeLines(proc.stderr, config.name, config.color);

    return {
      config,
      proc,
    };
  }

  private registerProcesses(current: ManagedProcess[]) {
    this.processes.push(...current);

    for (const managed of current) {
      void this.watchUnexpectedExit(managed);
    }
  }

  private startApps() {
    const current = this.configs.map(config => this.startProcess(config));

    this.registerProcesses(current);
  }

  private async watchUnexpectedExit(managed: ManagedProcess) {
    const code = await managed.proc.exited.catch(() => 1);

    if (this.restarting || this.exiting) return;

    // 主动停止的进程已经从当前列表移除
    if (!this.processes.includes(managed)) return;

    errorMain(`${managed.config.name} exited with code ${code}`);

    await this.exitAll('SIGTERM', code === 0 ? 0 : 1);
  }

  private async stopProcess(managed: ManagedProcess, signal: NodeJS.Signals = 'SIGTERM') {
    const exited = managed.proc.exited.then(
      () => true,
      () => true,
    );

    managed.proc.kill(signal);

    const graceful = await Promise.race([exited, Bun.sleep(3000).then(() => false)]);

    if (graceful) return;

    managed.proc.kill('SIGKILL');

    await managed.proc.exited.catch(() => {});
  }

  private async stopManagedProcesses(targets: ManagedProcess[], signal: NodeJS.Signals) {
    this.processes = this.processes.filter(managed => !targets.includes(managed));

    await Promise.all(targets.map(managed => this.stopProcess(managed, signal)));
  }

  private async stopApps(signal: NodeJS.Signals) {
    const targets = this.processes.filter(managed => managed.config.kind === 'app');

    await this.stopManagedProcesses(targets, signal);
  }

  private async stopAll(signal: NodeJS.Signals) {
    const current = this.processes;

    this.processes = [];

    await Promise.all(current.map(managed => this.stopProcess(managed, signal)));
  }
}
