export type ProcessKind = 'app' | 'service';
export type ProcessId = 'admin' | 'user' | 'event' | 'types';
export type ProcessCwd = 'server' | 'workspace';

export type DevProcess = {
  id: ProcessId;
  name: string;
  command: string[];
  color: string;
  kind: ProcessKind;
  cwd: ProcessCwd;
};

export type ManagedProcess = {
  config: DevProcess;
  proc: Bun.Subprocess<'ignore', 'pipe', 'pipe'>;
};

export type CliOptions = {
  enabled: Set<ProcessId>;
};
