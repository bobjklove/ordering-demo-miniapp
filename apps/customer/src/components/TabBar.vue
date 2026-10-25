<script setup lang="ts">
import { computed } from "vue";
import { demo, tr } from "../services/demo";
import { tab } from "../services/nav";

const tabs = [
  { url: "/pages/home/index", key: "tab_home" as const },
  { url: "/pages/menu/index", key: "tab_menu" as const, badge: true },
  { url: "/pages/orders/index", key: "tab_orders" as const },
  { url: "/pages/me/index", key: "tab_me" as const },
];

const count = computed(() => demo.state.cart.reduce((sum, line) => sum + line.qty, 0));

function current(): string {
  const pages = getCurrentPages();
  const route = pages[pages.length - 1]?.route || "";
  return route.startsWith("/") ? route : `/${route}`;
}

function active(url: string): boolean {
  return current() === url;
}
</script>

<template>
  <view class="tabbar">
    <view v-for="item in tabs" :key="item.url" class="tab" :class="{ on: active(item.url) }" @click="tab(item.url)">
      <text v-if="item.badge && count" class="badge">{{ count }}</text>
      <view class="tab-mark"></view>
      <text>{{ tr(item.key) }}</text>
    </view>
  </view>
</template>
