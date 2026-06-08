import { processPrefix } from './logger';

const ignoredMessages = ['is not in the project directory and will not be watched'];

function stripAnsi(text: string) {
  return text.replace(
    // eslint-disable-next-line no-control-regex
    /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
    '',
  );
}

function shouldIgnoreLine(line: string) {
  const plainText = stripAnsi(line);

  return ignoredMessages.some(message => plainText.includes(message));
}

export async function pipeLines(stream: ReadableStream<Uint8Array>, name: string, ansi: string) {
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

      buffered += decoder.decode(value, {
        stream: true,
      });

      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop() ?? '';

      for (const line of lines) {
        if (!line || shouldIgnoreLine(line)) {
          continue;
        }

        console.log(`${processPrefix(name, ansi)}${line}`);
      }
    }

    if (buffered && !shouldIgnoreLine(buffered)) {
      console.log(`${processPrefix(name, ansi)}${buffered}`);
    }
  } catch {
    // 子进程终止时，输出流可能中断
  } finally {
    reader.releaseLock();
  }
}
