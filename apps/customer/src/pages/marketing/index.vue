<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { onHide, onShow } from "@dcloudio/uni-app";
import { claimShare, extendFlashIfExpired, formatRemain, mockFriendJoin, startGroup } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { demo, L, makeId, money, patch, tr, useScreen } from "../../services/demo";
import { go } from "../../services/nav";

useScreen();
const nowTick = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

function tick(): void {
  nowTick.value = Date.now();
  const next = extendFlashIfExpired(demo.state, Date.now(), shop.flashDurationMs);
  if (next.flash.endsAt !== demo.state.flash.endsAt) patch(() => next);
}

onShow(() => {
  tick();
  timer = setInterval(tick, 1000);
});
onHide(() => timer && clearInterval(timer));
onUnmounted(() => timer && clearInterval(timer));

const flashProduct = computed(() => shop.products.find((item) => item.id === demo.state.flash.productId));
const groupProduct = computed(() => shop.products.find((item) => item.id === demo.state.groupCampaign.productId));
const group = computed(() =>
  demo.state.groups.find((item) => item.campaignId === demo.state.groupCampaign.id && (item.status === "open" || item.status === "success")),
);
const shareTemplate = shop.couponTemplates.find((item) => item.id === "share");

function start(): void {
  patch((state) => startGroup(state, Date.now(), makeId("grp")));
}

function join(): void {
  if (!group.value) return;
  const id = group.value.id;
  patch((state) => mockFriendJoin(state, id));
}

function share(): void {
  if (!shareTemplate) return;
  const claimed = demo.state.shareClaimed;
  patch((state) => claimShare(state, shareTemplate, Date.now(), makeId("c")));
  uni.setClipboardData({ data: tr("share_copy"), showToast: false });
  uni.showToast({ title: claimed ? tr("share_once") : tr("share_ok"), icon: "none" });
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('marketing_title')" back />
    <view class="card" v-if="flashProduct">
      <text class="tag">{{ tr("flash") }}</text>
      <text class="good-name">{{ L(flashProduct.name) }}</text>
      <text class="price">{{ money(demo.state.flash.price) }}</text>
      <text class="was">{{ money(flashProduct.price) }}</text>
      <text class="muted">{{ tr("flash_ends") }} {{ formatRemain(demo.state.flash.endsAt - nowTick) }} · {{ tr("flash_stock") }} {{ demo.state.flash.stockLeft }}</text>
      <text class="muted">{{ tr("flash_hint") }}</text>
      <button class="btn primary block" :disabled="!demo.state.flash.active || demo.state.flash.stockLeft <= 0" @click="go('/pages/menu/index?focus=' + flashProduct.id + '&pricing=flash')">
        {{ tr("flash_add") }}
      </button>
    </view>
    <view class="card" v-if="groupProduct">
      <text class="tag">{{ tr("group") }}</text>
      <text class="good-name">{{ L(groupProduct.name) }}</text>
      <text class="price">{{ money(demo.state.groupCampaign.price) }}</text>
      <text class="was">{{ money(groupProduct.price) }}</text>
      <text class="muted">{{ demo.state.groupCampaign.need }} {{ tr("group_need") }}</text>
      <text v-if="group" class="muted">{{ tr("group_people") }} {{ group.joined }}/{{ group.need }} · {{ group.status === "success" ? tr("group_ok") : tr("open_group") }}</text>
      <text class="muted">{{ tr("group_hint") }}</text>
      <button v-if="!group" class="btn primary block" @click="start">{{ tr("group_start") }}</button>
      <button v-else-if="group.status === 'open'" class="btn primary block" @click="join">{{ tr("group_join") }}</button>
      <button v-else class="btn leaf block" @click="go('/pages/menu/index?focus=' + groupProduct.id + '&pricing=group')">{{ tr("group_add") }}</button>
    </view>
    <view class="card">
      <text class="tag">{{ tr("share") }}</text>
      <text class="muted">{{ tr("share_hint") }}</text>
      <button class="btn ghost block" @click="share">{{ tr("share") }}</button>
    </view>
    <view class="section">{{ tr("my_coupons") }}</view>
    <view v-for="coupon in demo.state.coupons" :key="coupon.id" class="card">
      <view class="spread">
        <text>{{ L(coupon.name) }}</text>
        <text class="price">-{{ money(coupon.amountOff) }}</text>
      </view>
      <text class="muted">{{ tr("coupon_min") }} {{ money(coupon.minSpend) }} · {{ coupon.used ? tr("coupon_used") : tr("available") }}</text>
    </view>
  </view>
</template>
