<script setup lang="ts">
import { computed } from "vue";
import { levelProgress, registerMember, signOutMember } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import TabBar from "../../components/TabBar.vue";
import { demo, L, makeId, money, patch, resetDemo, toast, tr, useScreen } from "../../services/demo";
import { go, openAdmin } from "../../services/nav";

useScreen();
const progress = computed(() => levelProgress(demo.state.member.lifetimePoints, demo.state.levels));
const couponCount = computed(() => demo.state.coupons.filter((coupon) => !coupon.used && coupon.expiresAt > Date.now()).length);

function register(): void {
  const template = shop.couponTemplates.find((item) => item.id === "newcomer") ?? null;
  patch((state) => registerMember(state, { name: shop.demoMember.name, phone: shop.demoMember.phone }, template, Date.now(), makeId("c")));
  toast(tr("registered_ok"));
}

function signOut(): void {
  patch((state) => signOutMember(state));
}

function reset(): void {
  uni.showModal({
    title: tr("reset_title"),
    content: tr("reset_body"),
    success: (res) => {
      if (!res.confirm) return;
      resetDemo();
      toast(tr("reset_ok"));
    },
  });
}
</script>

<template>
  <view class="page with-tab" :style="themeStyle">
    <NavBar :title="tr('me_title')" />
    <view class="card">
      <view class="spread">
        <view class="seal">{{ shop.logoText }}</view>
        <view style="flex: 1">
          <text class="good-name">{{ demo.state.member.registered ? demo.state.member.name : tr("guest") }}</text>
          <text class="muted">{{ demo.state.member.registered ? demo.state.member.phone : tr("register_hint") }}</text>
        </view>
      </view>
      <text class="section">{{ progress.current.name[demo.locale] }}</text>
      <view class="bar"><view class="bar-fill" :style="{ width: `${Math.round(progress.ratio * 100)}%` }"></view></view>
      <text class="muted">
        {{ tr("lifetime") }} {{ demo.state.member.lifetimePoints }}
        <text v-if="progress.next"> · {{ tr("to_next") }} {{ progress.remaining }}</text>
        <text v-else> · {{ tr("max_level") }}</text>
      </text>
      <view class="kv"><text>{{ tr("points_now") }}</text><text>{{ demo.state.member.points }}</text></view>
      <view class="kv"><text>{{ tr("wallet_now") }}</text><text>{{ money(demo.state.member.walletBalance) }}</text></view>
      <view class="kv"><text>{{ tr("coupons") }}</text><text>{{ couponCount }}</text></view>
      <button v-if="!demo.state.member.registered" class="btn primary block" @click="register">{{ tr("one_tap") }}</button>
      <button v-else class="btn ghost block" @click="signOut">{{ tr("sign_out") }}</button>
      <text class="muted">{{ tr("sign_out_hint") }}</text>
    </view>
    <view class="card" @click="go('/pages/wallet/index')"><text>{{ tr("me_wallet") }}</text></view>
    <view class="card" @click="go('/pages/marketing/index')"><text>{{ tr("me_marketing") }}</text></view>
    <view class="card" @click="go('/pages/receipt/index')"><text>{{ tr("me_receipt") }}</text></view>
    <view class="card" @click="go('/pages/about/index')"><text>{{ tr("me_about") }}</text></view>
    <!-- #ifdef H5 -->
    <view class="card" @click="openAdmin">
      <text>{{ tr("open_admin") }}</text>
    </view>
    <!-- #endif -->
    <view class="card">
      <text class="section">{{ tr("rules") }}</text>
      <text class="muted">{{ tr("rule_earn") }} {{ demo.state.pointsRule.pointsPerUnit }} {{ tr("rule_then") }}</text>
      <text class="muted">{{ tr("rule_redeem") }} {{ demo.state.pointsRule.redeemPoints }} {{ tr("per") }} {{ money(demo.state.pointsRule.redeemCents) }}. {{ tr("half") }}</text>
      <text class="muted">{{ tr("directory_only") }}</text>
    </view>
    <button class="btn ghost block" @click="reset">{{ tr("me_reset") }}</button>
    <text class="muted">{{ L(shop.regionLabel) }}</text>
    <TabBar />
  </view>
</template>
