import { expect, it } from 'bun:test';

import { createProductCode } from '../domain';

it('生成 12 位不易混淆的商品 Nano ID', () => {
  const codes = Array.from({ length: 100 }, () => createProductCode());

  expect(new Set(codes).size).toBe(codes.length);
  expect(codes.every(code => /^[23456789A-HJ-NP-Z]{12}$/.test(code))).toBe(true);
});
