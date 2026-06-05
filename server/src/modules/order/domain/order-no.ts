import { customAlphabet } from 'nanoid';

export class OrderNo {
  static create() {
    return `ORD${formatUtcTimestamp()}${createRandomHex(12)}`;
  }
}

function formatUtcTimestamp(date = new Date()) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    pad(date.getUTCMilliseconds(), 3),
  ].join('');
}

function pad(value: number, length = 2) {
  return value.toString().padStart(length, '0');
}

const createRandomHex = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
