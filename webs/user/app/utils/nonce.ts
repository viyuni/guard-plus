import { v7 } from 'uuid';

export function createNonce() {
  return v7();
}
