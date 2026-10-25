<script setup lang="ts">
import { computed } from "vue";
import { makeCatalog, priceLine, setQty, withCart, type PricedLine } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { demo, explain, L, money, patch, tr, useScreen } from "../../services/demo";
import { go, tab } from "../../services/nav";

useScreen();
const catalog = computed(() => makeCatalog(shop.products, demo.state));

const rows = computed(() =>
  demo.state.cart.map((line) => {
    try {
      return { ok: true as const, priced: priceLine(catalog.value, line), rawId: line.lineId };
    } catch (error) {
      return { ok: false as const, rawId: line.lineId, name: line.productId, error: explain(error) };
    }
  }),
);

const subtotal = computed(() => rows.value.reduce((sum, row) => sum + (row.ok ? row.priced.lineTotal : 0), 0));

function change(lineId: string, qty: number): void {
  patch((state) => withCart(state, setQty(state.cart, lineId, qty)));
}

function summary(line: PricedLine): string {
  return [line.specSummary[demo.locale], line.addonSummary[demo.locale]].filter(Boolean).join(" · ");
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('cart_title')" back />
    <view v-if="!rows.length" class="empty">
      <text>{{ tr("cart_empty") }}</text>
      <button class="btn primary block" @click="tab('/pages/menu/index')">{{ tr("go_menu") }}</button>
    </view>
    <view v-for="row in rows" :key="row.rawId" class="card">
      <template v-if="row.ok">
        <view class="line-top">
          <text class="line-name">{{ L(row.priced.name) }}</text>
          <text class="price">{{ money(row.priced.lineTotal) }}</text>
        </view>
        <text class="muted">{{ summary(row.priced) || tr("default_spec") }}</text>
        <text v-if="row.priced.pricing !== 'regular'" class="tag">{{ tr(row.priced.pricing === "flash" ? "flash_price" : "group_price") }}</text>
        <view class="stepper" style="margin-top: 16rpx">
          <button @click="change(row.rawId, row.priced.qty - 1)">−</button>
          <text>{{ row.priced.qty }}</text>
          <button @click="change(row.rawId, row.priced.qty + 1)">+</button>
          <button class="btn ghost small" @click="change(row.rawId, 0)">{{ tr("remove") }}</button>
        </view>
      </template>
      <template v-else>
        <text class="warn">{{ row.error }}</text>
        <button class="btn ghost small" @click="change(row.rawId, 0)">{{ tr("remove") }}</button>
      </template>
    </view>
    <view v-if="rows.length" class="card">
      <view class="kv"><text>{{ tr("subtotal") }}</text><text class="price">{{ money(subtotal) }}</text></view>
      <text class="muted">{{ tr("cart_sub") }}</text>
      <button class="btn primary block" @click="go('/pages/checkout/index')">{{ tr("checkout") }}</button>
      <button class="btn ghost block" @click="tab('/pages/menu/index')">{{ tr("continue_add") }}</button>
    </view>
  </view>
</template>
