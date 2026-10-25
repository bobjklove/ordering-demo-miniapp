<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { setPendingTable } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import TabBar from "../../components/TabBar.vue";
import { L, patch, tr, useScreen } from "../../services/demo";
import { callShop, go, openShopMap, tab } from "../../services/nav";

useScreen();
onLoad((query) => {
  const table = typeof query?.table === "string" ? query.table : "";
  if (table) patch((state) => setPendingTable(state, table));
});
</script>

<template>
  <view class="page with-tab" :style="themeStyle">
    <NavBar :title="L(shop.name)" />
    <view class="hero">
      <view class="seal">{{ shop.logoText }}</view>
      <view>
        <text class="hero-name">{{ L(shop.name) }}</text>
        <text class="slogan">{{ L(shop.slogan) }}</text>
        <text class="region">{{ L(shop.regionLabel) }}</text>
      </view>
    </view>
    <swiper class="swiper" circular autoplay interval="3800" indicator-dots indicator-color="rgba(255,255,255,.45)" indicator-active-color="#ffffff">
      <swiper-item v-for="banner in shop.banners" :key="banner.id">
        <view class="banner" :style="{ backgroundColor: banner.tone }">
          <text class="kicker">{{ L(banner.kicker) }}</text>
          <text class="banner-title">{{ L(banner.title) }}</text>
          <text class="banner-sub">{{ L(banner.subtitle) }}</text>
        </view>
      </swiper-item>
    </swiper>
    <view class="notice">
      <text class="notice-label">{{ tr("notice") }}</text>
      <text class="notice-body">{{ L(shop.notice) }}</text>
    </view>
    <view class="card" @click="callShop">
      <text class="info-k">{{ tr("hours") }}</text>
      <text class="info-v">{{ L(shop.hours) }}</text>
    </view>
    <view class="card" @click="openShopMap">
      <text class="info-k">{{ tr("address") }}</text>
      <text class="info-v">{{ L(shop.address) }}</text>
      <text class="info-a">{{ tr("open_map") }}</text>
    </view>
    <view class="card" @click="callShop">
      <text class="info-k">{{ tr("call") }}</text>
      <text class="info-v">{{ shop.phoneDisplay }}</text>
      <text class="info-a">{{ tr("call_now") }}</text>
    </view>
    <button class="btn primary block" @click="tab('/pages/menu/index')">{{ tr("start_order") }}</button>
    <view class="quick">
      <view @click="go('/pages/marketing/index')">{{ tr("marketing") }}</view>
      <view @click="go('/pages/wallet/index')">{{ tr("me_wallet") }}</view>
      <view @click="go('/pages/about/index')">{{ tr("about") }}</view>
    </view>
    <TabBar />
  </view>
</template>
