<script setup lang="ts">
import { shop, themeStyle } from "@demo/shop";
import { reorderIntoCart } from "@demo/core";
import NavBar from "../../components/NavBar.vue";
import TabBar from "../../components/TabBar.vue";
import { demo, formatWhen, money, patch, statusKey, toast, tr, useScreen } from "../../services/demo";
import { go } from "../../services/nav";

useScreen();

function reorder(id: string): void {
  const order = demo.state.orders.find((item) => item.id === id);
  if (!order) return;
  let skipped: string[] = [];
  patch((state) => {
    const result = reorderIntoCart(state, shop.products, order);
    skipped = result.skipped;
    return result.state;
  });
  toast(skipped.length ? tr("skipped") : tr("reorder_done"));
  go("/pages/cart/index");
}
</script>

<template>
  <view class="page with-tab" :style="themeStyle">
    <NavBar :title="tr('orders_title')" />
    <view v-if="!demo.state.orders.length" class="empty">
      <text>{{ tr("history_empty") }}</text>
      <button class="btn primary block" @click="go('/pages/menu/index')">{{ tr("go_menu") }}</button>
    </view>
    <view v-for="order in demo.state.orders" :key="order.id" class="card" @click="go('/pages/order/index?id=' + order.id)">
      <view class="spread">
        <text class="ticket-no" style="font-size: 48rpx">{{ order.pickupNo }}</text>
        <text class="tag">{{ tr(statusKey(order.status)) }}</text>
      </view>
      <text class="muted">{{ formatWhen(order.createdAt) }} · {{ money(order.payable + order.walletApplied) }}</text>
      <view class="spread" style="margin-top: 12rpx">
        <text class="muted">+{{ order.pointsEarned }} {{ tr("points_unit") }}</text>
        <button class="btn ghost small" @click.stop="reorder(order.id)">{{ tr("again") }}</button>
      </view>
    </view>
    <TabBar />
  </view>
</template>
