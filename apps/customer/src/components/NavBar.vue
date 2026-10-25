<script setup lang="ts">
import { goBack, statusPad } from "../services/nav";
import LangPill from "./LangPill.vue";

defineProps<{ title: string; back?: boolean }>();
const pad = statusPad();
</script>

<template>
  <view class="nav" :style="{ paddingTop: pad }">
    <view class="nav-row">
      <view class="nav-side">
        <view v-if="back" class="back" @click="goBack">‹</view>
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-side end"><LangPill /></view>
    </view>
  </view>
</template>
