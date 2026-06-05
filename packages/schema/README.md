# @shared/schema

Shared TypeScript contracts for Guard Plus.

This package owns Valibot schemas, request/response types, and common API DTOs consumed by the backend and Nuxt apps. Keep business logic and persistence code out of this package; it should describe cross-package contracts only.

## Structure

- `src/common.ts`: common schema helpers and shared shapes.
- `src/admin.ts`, `src/user.ts`: account and auth contracts.
- `src/product.ts`, `src/order.ts`, `src/reward.ts`, `src/stock.ts`: feature contracts.
- `src/point-*.ts`: point account, type, transaction, and conversion contracts.
- `src/index.ts`: package-level exports.
- `tsconfig/common.json`: shared TypeScript config export.

## Scripts

```bash
vpr @shared/schema#typecheck
```

Use package subpath imports such as `@shared/schema/product` when a consumer only needs one contract area.
