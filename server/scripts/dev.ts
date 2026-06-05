type DevApp = {
  name: 'admin' | 'user' | 'event';
  color: string;
};

const reset = '\x1b[0m';

const apps = [
  { name: 'admin', color: Bun.color('#5EAAB5', 'ansi') ?? '' },
  { name: 'user', color: Bun.color('#E6CC77', 'ansi') ?? '' },
  { name: 'event', color: Bun.color('#D9739F', 'ansi') ?? '' },
] satisfies DevApp[];

type AppName = (typeof apps)[number]['name'];

function color(text: string, ansi: string) {
  return ansi ? `${ansi}${text}${reset}` : text;
}

function prefix(name: AppName, ansi: string) {
  return color(`${name.padEnd(5)} | `, ansi);
}

function mainPrefix() {
  const ansi = Bun.color('#9CA3AF', 'ansi') ?? '';
  return color(`${'main'.padEnd(5)} | `, ansi);
}

function shouldIgnoreLine(line: string) {
  return line.includes('is not in the project directory and will not be watched');
}

async function pipeLines(stream: ReadableStream<Uint8Array>, name: AppName, ansi: string) {
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  let buffered = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        buffered += decoder.decode();
        break;
      }

      buffered += decoder.decode(value, { stream: true });

      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop() ?? '';

      for (const line of lines) {
        if (shouldIgnoreLine(line)) continue;
        console.log(`${prefix(name, ansi)}${line}`);
      }
    }

    if (buffered && !shouldIgnoreLine(buffered)) {
      console.log(`${prefix(name, ansi)}${buffered}`);
    }
  } catch {
    // 进程被 kill 时 pipe 可能中断，忽略即可
  } finally {
    reader.releaseLock();
  }
}

function dev(app: DevApp) {
  const { color: ansi, name } = app;

  const proc = Bun.spawn(
    [
      'bun',
      '--env-file=.env',
      '--no-orphans',
      '--no-clear-screen',
      '--watch',
      `./src/apps/${name}/index.ts`,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    },
  );

  void pipeLines(proc.stdout, name, ansi);
  void pipeLines(proc.stderr, name, ansi);

  return {
    app,
    proc,
  };
}

type ManagedProcess = ReturnType<typeof dev>;

let processes: ManagedProcess[] = [];
let restarting = false;
let exiting = false;

function startAll() {
  const current = apps.map(dev);
  processes = current;

  for (const managed of current) {
    void watchUnexpectedExit(managed);
  }
}

async function watchUnexpectedExit(managed: ManagedProcess) {
  const code = await managed.proc.exited.catch(() => 1);

  if (restarting || exiting) return;

  // 如果这个进程已经不是当前批次里的进程，也忽略
  if (!processes.includes(managed)) return;

  console.error(`${mainPrefix()}${managed.app.name} exited with code ${code}`);

  await exitAll('SIGTERM', code === 0 ? 0 : 1);
}

async function stopProcess(managed: ManagedProcess, signal: NodeJS.Signals = 'SIGTERM') {
  const { proc } = managed;

  const exited = proc.exited.then(
    () => true,
    () => true,
  );

  proc.kill(signal);

  const graceful = await Promise.race([exited, Bun.sleep(3000).then(() => false)]);

  if (!graceful) {
    proc.kill('SIGKILL');
    await proc.exited.catch(() => {});
  }
}

async function stopAll(signal: NodeJS.Signals = 'SIGTERM') {
  const current = processes;
  processes = [];

  await Promise.all(current.map(proc => stopProcess(proc, signal)));
}

async function restartAll() {
  if (restarting || exiting) return;

  restarting = true;

  try {
    console.log(`${mainPrefix()}restarting...`);

    await stopAll('SIGTERM');

    startAll();

    console.log(`${mainPrefix()}restarted`);
  } finally {
    restarting = false;
  }
}

async function exitAll(signal: NodeJS.Signals = 'SIGTERM', code = 0) {
  if (exiting) return;

  exiting = true;

  await stopAll(signal);
  process.exit(code);
}

function setupKeyboard() {
  if (!process.stdin.isTTY) return;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', input => {
    if (input === 'r' || input === 'R') {
      void restartAll();
      return;
    }

    // Ctrl+C
    if (input === '\x03') {
      void exitAll('SIGINT', 0);
      return;
    }

    // Ctrl+D
    if (input === '\x04') {
      void exitAll('SIGTERM', 0);
      return;
    }
  });
}

startAll();
setupKeyboard();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void exitAll(signal, 0);
  });
}

// 保持主进程存活
await new Promise(() => {});
