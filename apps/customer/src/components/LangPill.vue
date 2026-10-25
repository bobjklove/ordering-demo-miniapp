<script setup lang="ts">
import { demo, setLocale } from "../services/demo";
</script>

<template>
  <view class="lang">
    <text :class="{ on: demo.locale === 'zh' }" @click="setLocale('zh')">中</text>
    <text :class="{ on: demo.locale === 'en' }" @click="setLocale('en')">EN</text>
  </view>
</template>
