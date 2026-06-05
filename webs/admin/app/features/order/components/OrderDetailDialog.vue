<script setup lang="ts">
import type { Order } from './OrderListView.vue';

defineProps<{
  order: Order;
}>();

const open = defineModel<boolean>('open', { default: false });

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toLocaleString() : '-';
}

function formatStatus(status: Order['status']) {
  return status === 'pending' ? '待处理' : status === 'completed' ? '已完成' : '已退款';
}

function formatDeliveryType(deliveryType: Order['deliveryTypeSnapshot']) {
  return deliveryType === 'automatic' ? '自动发货' : '人工发货';
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>订单详情</DialogTitle>
        <DialogDescription>{{ order.orderNo }}</DialogDescription>
      </DialogHeader>

      <div class="border-border divide-border rounded-md border text-sm">
        <section class="space-y-3 p-3">
          <div class="text-muted-foreground font-medium">订单</div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">状态</div>
              <div>
                <Badge
                  size="sm"
                  :variant="
                    order.status === 'refunded'
                      ? 'destructive'
                      : order.status === 'completed'
                        ? 'outline'
                        : 'secondary'
                  "
                >
                  {{ formatStatus(order.status) }}
                </Badge>
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">创建时间</div>
              <div class="text-foreground">{{ formatDate(order.createdAt) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">完成时间</div>
              <div class="text-foreground">{{ formatDate(order.completedAt) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">退款时间</div>
              <div class="text-foreground">{{ formatDate(order.refundedAt) }}</div>
            </div>
          </div>
        </section>

        <section v-if="order.productDeliveryContentSnapshot" class="space-y-3 border-t p-3">
          <div class="text-muted-foreground font-medium">自动发货内容</div>
          <div class="text-foreground break-all whitespace-pre-wrap">
            {{ order.productDeliveryContentSnapshot }}
          </div>
        </section>

        <section class="space-y-3 border-t p-3">
          <div class="text-muted-foreground font-medium">商品</div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">商品名称</div>
              <div class="text-foreground font-medium">{{ order.productNameSnapshot }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">发货方式</div>
              <div class="text-foreground">
                {{ formatDeliveryType(order.deliveryTypeSnapshot) }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">积分类型</div>
              <div class="text-foreground">{{ order.pointTypeNameSnapshot }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">价格</div>
              <div class="text-foreground font-medium">{{ order.price }}</div>
            </div>
          </div>
        </section>

        <section class="space-y-3 border-t p-3">
          <div class="text-muted-foreground font-medium">配送</div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">快递公司</div>
              <div class="text-foreground">{{ order.expressCompany ?? '-' }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">快递单号</div>
              <div class="text-foreground">{{ order.expressNo ?? '-' }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">收货手机号</div>
              <div class="text-foreground break-all">{{ order.receiverPhoneEncrypted ?? '-' }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">收货地址</div>
              <div class="text-foreground break-all">
                {{ order.receiverAddressEncrypted ?? '-' }}
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-3 border-t p-3">
          <div class="text-muted-foreground font-medium">备注</div>
          <div class="space-y-3">
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">用户备注</div>
              <div class="text-foreground whitespace-pre-wrap">{{ order.userRemark ?? '-' }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground text-xs">退款原因</div>
              <div class="text-foreground whitespace-pre-wrap">{{ order.refundReason ?? '-' }}</div>
            </div>
          </div>
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>
