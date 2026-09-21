import { createEventApp } from './composition';

const app = await createEventApp();
let isStopping = false;

async function shutdown(signal: NodeJS.Signals) {
  if (isStopping) {
    return;
  }

  isStopping = true;

  try {
    await app.stop();
  } catch (error) {
    console.error(`Event App shutdown failed after ${signal}`, error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await app.start();
