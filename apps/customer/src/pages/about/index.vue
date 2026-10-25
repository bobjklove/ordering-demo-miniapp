<script setup lang="ts">
import { guide, shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { L, tr, useScreen } from "../../services/demo";

useScreen();
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('about_title')" back />
    <view class="hero">
      <view class="seal">{{ shop.logoText }}</view>
      <view>
        <text class="hero-name">{{ L(shop.name) }}</text>
        <text class="slogan">{{ tr("about_lead") }}</text>
      </view>
    </view>
    <text class="section">{{ tr("guide_title") }}</text>
    <view v-for="(item, index) in guide" :key="index" class="card">
      <text class="pair-zh">{{ item.zh }}</text>
      <text class="pair-en">{{ item.en }}</text>
    </view>
    <text class="muted">{{ tr("about_foot") }} {{ L(shop.regionLabel) }}</text>
  </view>
</template>
