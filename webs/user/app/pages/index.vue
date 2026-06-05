<script setup lang="ts">
import { useOverlay } from '@web/ui/components/ui/overlay';

import { useCreateOrder } from '~/features/order';
import { PointActions } from '~/features/point';
import { ProductGrid, PurchaseConfirmDialog } from '~/features/product';
import type { Product } from '~/features/product';

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
const PointConversionDialog = defineAsyncComponent(
  () => import('~/features/point/components/PointConversionDialog.vue'),
);
const PointTransactionsDialog = defineAsyncComponent(
  () => import('~/features/point/components/PointTransactionsDialog.vue'),
);

const buyingProductId = ref<string>();
const pointActionsCollapsed = ref(false);
const pointActionsExpandedByClick = ref(false);
const pointActionsExpandedScrollTop = ref(0);
const storefrontScrollTop = ref(0);

const createOrderMutation = useCreateOrder();
const { balances, isAuthenticated, refreshUser } = useUser();
const hasPointAccounts = computed(() => balances.value.length > 0);
const [openAuthDialogOverlay] = useOverlay(AuthDialog);
const [openProfileDialog] = useOverlay(ProfileDialog);
const [openOrdersDialog] = useOverlay(OrdersDialog);
const [openPurchaseDetailDialog] = useOverlay(PurchaseDetailDialog);
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

function handleStorefrontScroll(event: Event) {
  const scrollTop = (event.currentTarget as HTMLElement).scrollTop;

  storefrontScrollTop.value = scrollTop;

  if (
    pointActionsExpandedByClick.value &&
    scrollTop > 48 &&
    Math.abs(scrollTop - pointActionsExpandedScrollTop.value) < 96
  ) {
    return;
  }

  pointActionsExpandedByClick.value = false;

  if (pointActionsCollapsed.value) {
    pointActionsCollapsed.value = scrollTop > 48;
    return;
  }

  pointActionsCollapsed.value = scrollTop > 120;
}

function expandPointActions() {
  pointActionsCollapsed.value = false;
  pointActionsExpandedByClick.value = true;
  pointActionsExpandedScrollTop.value = storefrontScrollTop.value;
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
  <main class="storefront relative h-svh overflow-y-auto" @scroll.passive="handleStorefrontScroll">
    <AppHeader
      @login="openAuthDialog('login')"
      @edit-profile="openProfileDialog"
      @view-transactions="openPointTransactionsDialog"
      @view-orders="openOrdersDialog"
    />

    <section
      class="sticky top-16 z-40 flex w-full justify-center px-5 transition-[padding] duration-200 md:px-8"
      :class="pointActionsCollapsed ? 'py-0' : 'py-8 md:py-8'"
    >
      <PointActions
        v-if="hasPointAccounts"
        :collapsed="pointActionsCollapsed"
        @login="openAuthDialog('login')"
        @expand="expandPointActions"
        @open-conversion="openPointConversionDialog"
      />
    </section>

    <ProductGrid :buying-product-id="buyingProductId" @buy="requestBuyProduct" />
  </main>
</template>
