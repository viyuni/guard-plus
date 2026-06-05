<script setup lang="ts">
import { useOverlay } from '@web/ui/components/ui/overlay';

import { useCreateOrder } from '~/features/order';
import { PointActions } from '~/features/point';
import { ProductGrid, PurchaseConfirmDialog } from '~/features/product';
import type { Product } from '~/features/product';

type PointActionsDialogAction = 'conversion' | 'transactions';

const AuthDialog = defineAsyncComponent(
  () => import('~/features/account/components/AuthDialog.vue'),
);
const ProfileDialog = defineAsyncComponent(
  () => import('~/features/account/components/ProfileDialog.vue'),
);
const OrdersDialog = defineAsyncComponent(
  () => import('~/features/order/components/OrdersDialog.vue'),
);
const PurchaseDetailDialog = defineAsyncComponent(
  () => import('~/features/order/components/PurchaseDetailDialog.vue'),
);
const PointActionsDialog = defineAsyncComponent(
  () => import('~/features/point/components/PointActionsDialog.vue'),
);
const PointConversionDialog = defineAsyncComponent(
  () => import('~/features/point/components/PointConversionDialog.vue'),
);
const PointTransactionsDialog = defineAsyncComponent(
  () => import('~/features/point/components/PointTransactionsDialog.vue'),
);

const buyingProductId = ref<string>();

const createOrderMutation = useCreateOrder();
const { isAuthenticated, refreshUser } = useUser();
const [openAuthDialogOverlay] = useOverlay(AuthDialog);
const [openProfileDialog] = useOverlay(ProfileDialog);
const [openOrdersDialog] = useOverlay(OrdersDialog);
const [openPurchaseDetailDialog] = useOverlay(PurchaseDetailDialog);
const [openPointActionsDialog] = useOverlay(PointActionsDialog);
const [openPointConversionDialog] = useOverlay(PointConversionDialog);
const [openPointTransactionsDialog] = useOverlay(PointTransactionsDialog);
const [openPurchaseConfirmDialog] = useOverlay(PurchaseConfirmDialog);

function normalizeDetail(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const detail = value.trim();

  return detail ? detail : undefined;
}

function openAuthDialog(authMode: 'login' | 'register' = 'login') {
  openAuthDialogOverlay({ authMode }).catch(() => {});
}

async function openPointActions() {
  const action = (await openPointActionsDialog()) as PointActionsDialogAction | undefined;

  if (action === 'conversion') {
    await openPointConversionDialog();
  } else if (action === 'transactions') {
    await openPointTransactionsDialog();
  }
}

async function requestBuyProduct(product: Product) {
  if (product?.status !== 'active') {
    return;
  }

  if (!isAuthenticated.value) {
    openAuthDialog('login');
    return;
  }

  const confirmed = await openPurchaseConfirmDialog({
    product,
    isBuying: buyingProductId.value === product.id,
  });

  if (confirmed) {
    await buyProduct(product);
  }
}

async function buyProduct(product: Product) {
  const productId = product.id;

  if (!productId) {
    return;
  }

  buyingProductId.value = productId;

  try {
    const { data: order } = await createOrderMutation.mutateAsync({
      productId,
      nonce: createNonce(),
    });

    const detail = normalizeDetail(order?.detail);

    if (detail) {
      await openPurchaseDetailDialog({
        orderNo: order?.orderNo,
        detail,
      });
    }

    await refreshUser();
  } catch {
    // The global mutation handler reports request errors.
  } finally {
    buyingProductId.value = undefined;
  }
}
</script>

<template>
  <main class="storefront relative h-svh overflow-y-auto">
    <AppHeader
      @login="openAuthDialog('login')"
      @edit-profile="openProfileDialog"
      @view-points="openPointActions"
      @view-transactions="openPointTransactionsDialog"
      @view-orders="openOrdersDialog"
    />

    <section class="flex w-full justify-center px-5 py-8 md:px-8">
      <PointActions
        class="hidden sm:inline-flex"
        @login="openAuthDialog('login')"
        @open-conversion="openPointConversionDialog"
      />
    </section>

    <ProductGrid :buying-product-id="buyingProductId" @buy="requestBuyProduct" />
  </main>
</template>
