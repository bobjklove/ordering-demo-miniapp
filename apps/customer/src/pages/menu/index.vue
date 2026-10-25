<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { makeCatalog, priceLine, setPendingTable, visibleProducts, type PricingMode, type Sellable } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import SpecSheet from "../../components/SpecSheet.vue";
import TabBar from "../../components/TabBar.vue";
import { demo, L, money, patch, tr, useScreen } from "../../services/demo";
import { go } from "../../services/nav";

useScreen();
const cat = ref("all");
const openId = ref<string | null>(null);
const pricing = ref<PricingMode>("regular");

onLoad((query) => {
  const table = typeof query?.table === "string" ? query.table : "";
  if (table) patch((state) => setPendingTable(state, table));
  if (typeof query?.focus === "string") openId.value = query.focus;
  if (query?.pricing === "flash" || query?.pricing === "group") pricing.value = query.pricing;
});

const catalog = computed(() => makeCatalog(shop.products, demo.state));
const products = computed(() => {
  const list = visibleProducts(catalog.value.products);
  return cat.value === "all" ? list : list.filter((item) => item.categoryId === cat.value);
});
const count = computed(() => demo.state.cart.reduce((sum, line) => sum + line.qty, 0));
const subtotal = computed(() => {
  let sum = 0;
  for (const line of demo.state.cart) {
    try {
      sum += priceLine(catalog.value, line).lineTotal;
    } catch {
      /* unavailable line stays visible in the cart */
    }
  }
  return sum;
});

function flashOn(product: Sellable): boolean {
  const flash = catalog.value.flash;
  return Boolean(flash && flash.active && flash.productId === product.id && flash.stockLeft > 0);
}

function showPrice(product: Sellable): number {
  if (flashOn(product) && catalog.value.flash) return catalog.value.flash.price;
  return product.price;
}

function hasExtra(product: Sellable): boolean {
  return product.specs.some((group) => group.options.some((option) => option.priceDelta > 0));
}

function badgeKey(badge: string): "badge_hot" | "badge_new" | "badge_flash" | "badge_group" {
  if (badge === "new") return "badge_new";
  if (badge === "flash") return "badge_flash";
  if (badge === "group") return "badge_group";
  return "badge_hot";
}

function open(product: Sellable): void {
  pricing.value = flashOn(product) ? "flash" : "regular";
  openId.value = product.id;
}
</script>

<template>
  <view class="page with-tab" :style="themeStyle">
    <NavBar :title="tr('menu_title')" />
    <scroll-view scroll-x class="cats">
      <text class="cat" :class="{ on: cat === 'all' }" @click="cat = 'all'">{{ tr("all") }}</text>
      <text v-for="item in shop.categories" :key="item.id" class="cat" :class="{ on: cat === item.id }" @click="cat = item.id">
        {{ L(item.name) }}
      </text>
    </scroll-view>
    <view v-if="!products.length" class="empty">{{ tr("empty_products") }}</view>
    <view v-for="product in products" :key="product.id" class="good" @click="open(product)">
      <view class="thumb" :style="{ background: product.tone }">{{ product.emoji }}</view>
      <view class="good-body">
        <view class="good-name-row">
          <text class="good-name">{{ L(product.name) }}</text>
          <text v-if="product.soldOut" class="tag sold">{{ tr("sold_out") }}</text>
        </view>
        <text class="desc">{{ L(product.desc) }}</text>
        <view v-if="product.badges?.length" class="tags">
          <text v-for="badge in product.badges" :key="badge" class="tag">{{ tr(badgeKey(badge)) }}</text>
        </view>
        <view class="good-foot">
          <text class="price">{{ money(showPrice(product)) }}</text>
          <text v-if="flashOn(product)" class="was">{{ money(product.price) }}</text>
          <text v-else-if="hasExtra(product)" class="muted">{{ tr("from") }}</text>
          <button class="plus" @click.stop="open(product)">{{ product.soldOut ? tr("sold_out") : tr("quick_add") }}</button>
        </view>
      </view>
    </view>
    <view v-if="count" class="dock">
      <view>
        <text>{{ count }} {{ tr("items") }}</text>
        <text class="price" style="display: block; color: #fffaf3">{{ money(subtotal) }}</text>
      </view>
      <button class="btn" @click="go('/pages/cart/index')">{{ tr("cart_bar") }}</button>
    </view>
    <SpecSheet :product-id="openId" :pricing="pricing" @close="openId = null" @added="openId = null" />
    <TabBar />
  </view>
</template>
