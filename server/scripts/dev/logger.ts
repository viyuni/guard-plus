const reset = '\x1b[0m';
const mainAnsi = Bun.color('#9CA3AF', 'ansi') ?? '';

function color(text: string, ansi: string) {
  return ansi ? `${ansi}${text}${reset}` : text;
}

export function processPrefix(name: string, ansi: string) {
  return color(`${name.padEnd(12)} | `, ansi);
}

export function mainPrefix() {
  return color(`${'Main'.padEnd(12)} | `, mainAnsi);
}

export function logMain(message: string) {
  console.log(`${mainPrefix()}${message}`);
}

export function errorMain(message: string, error?: unknown) {
  if (error === undefined) {
    console.error(`${mainPrefix()}${message}`);
    return;
  }

  console.error(`${mainPrefix()}${message}`, error);
}
