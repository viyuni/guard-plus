export const StockIdempotencyKey = {
  adminAdjust(input: { productId: string; adminId: string; nonce: string }) {
    return `admin:stock:adjust:${input.productId}:${input.adminId}:${input.nonce}`;
  },

  orderConsume(input: { orderId: string }) {
    return `order:${input.orderId}:stock:consume`;
  },

  orderRestore(input: { orderId: string }) {
    return `order:${input.orderId}:stock:restore`;
  },
};
