<script setup lang="ts">
import { computed } from "vue";
import { liveDashboard } from "@demo/core";
import { shop } from "@demo/shop";
import { demo, L, money, rate, tr } from "../demo";

const summary = computed(() => liveDashboard(shop.dashboard, demo.state.orders, Date.now()));
const maxHot = computed(() => Math.max(1, ...summary.value.hot.map((item) => item.count)));
const recent = computed(() => demo.state.orders.slice(0, 6));

function productName(id: string): string {
  const product = shop.products.find((item) => item.id === id);
  return product ? L(product.name) : id;
}
</script>

<template>
  <section>
    <h1>{{ tr("dash_hello") }}</h1>
    <p class="sub">{{ tr("includes_live") }} {{ tr("connected") }}</p>
    <div class="grid">
      <article class="card stat"><span>{{ tr("today_orders") }}</span><strong>{{ summary.orders }}</strong><small class="muted">+{{ summary.liveOrders }} {{ tr("live") }}</small></article>
      <article class="card stat"><span>{{ tr("today_revenue") }}</span><strong>{{ money(summary.revenue) }}</strong><small class="muted">+{{ money(summary.liveRevenue) }}</small></article>
      <article class="card stat"><span>{{ tr("repurchase") }}</span><strong>{{ rate(summary.repurchaseRate) }}</strong><small class="muted">{{ tr("baseline") }}</small></article>
      <article class="card stat"><span>{{ tr("pending") }}</span><strong>{{ summary.pending }}</strong><small class="muted">{{ tr("pending_now") }}</small></article>
    </div>
    <div class="layout">
      <article class="card">
        <h2>{{ tr("hot_title") }}</h2>
        <div v-for="item in summary.hot" :key="item.productId" class="bar-row">
          <span>{{ productName(item.productId) }}</span>
          <span class="bar"><i :style="{ width: `${(item.count / maxHot) * 100}%` }"></i></span>
          <span class="mini">{{ item.count }}</span>
        </div>
      </article>
      <article class="card">
        <h2>{{ tr("recent") }}</h2>
        <p v-if="!recent.length" class="muted">{{ tr("no_orders") }}</p>
        <div v-for="order in recent" :key="order.id" class="spread order">
          <strong>{{ order.pickupNo }}</strong>
          <span>{{ tr(("status_" + order.status) as "status_placed") }}</span>
          <span class="mini">{{ money(order.payable + order.walletApplied) }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
