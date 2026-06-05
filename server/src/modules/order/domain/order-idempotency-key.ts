export const OrderIdempotencyKey = {
  create(input: { nonce: string }) {
    return `order:create:${input.nonce}`;
  },
};
