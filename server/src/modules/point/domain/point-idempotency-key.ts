export const PointIdempotencyKey = {
  adminAdjust(input: { adminId: string; nonce: string }) {
    return `admin:points:adjust:${input.adminId}:${input.nonce}`;
  },

  conversionConsume(input: { ruleId: string; nonce: string }) {
    return `point:conversion:${input.ruleId}:${input.nonce}:consume`;
  },

  conversionGrant(input: { ruleId: string; nonce: string }) {
    return `point:conversion:${input.ruleId}:${input.nonce}:grant`;
  },

  orderConsume(input: { orderId: string }) {
    return `order:${input.orderId}:points:consume`;
  },

  orderRefund(input: { orderId: string }) {
    return `order:${input.orderId}:points:refund`;
  },

  reversal(input: { transactionId: string }) {
    return `point-transaction:${input.transactionId}:reversal`;
  },

  biliGuard(input: { sourceId: string; ruleId: string }) {
    return `bili-guard:${input.sourceId}:rule:${input.ruleId}`;
  },
};
