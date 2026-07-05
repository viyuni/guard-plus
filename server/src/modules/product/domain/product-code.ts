import { customAlphabet } from 'nanoid';

const PRODUCT_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const PRODUCT_CODE_LENGTH = 12;

const createNanoId = customAlphabet(PRODUCT_CODE_ALPHABET, PRODUCT_CODE_LENGTH);

export function createProductCode() {
  return createNanoId();
}
