<script setup lang="ts">
import { topUp } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { demo, money, patch, toast, tr, useScreen } from "../../services/demo";

useScreen();

function buy(pay: number, bonus: number): void {
  patch((state) => topUp(state, { pay, bonus }));
  toast(tr("topup_ok"));
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('wallet_title')" back />
    <view class="ticket">
      <view class="ticket-stripe"></view>
      <view class="ticket-body">
        <text class="muted">{{ tr("wallet_balance") }}</text>
        <text class="ticket-no" style="font-size: 72rpx">{{ money(demo.state.member.walletBalance) }}</text>
        <text class="muted">{{ tr("topup_hint") }}</text>
      </view>
    </view>
    <view v-for="tier in shop.walletTiers" :key="tier.pay" class="card spread">
      <view>
        <text class="good-name">{{ tr("pay_get") }} {{ money(tier.pay) }}</text>
        <text class="muted">{{ tr("bonus") }} {{ money(tier.bonus) }} · {{ tr("stored") }} {{ money(tier.pay + tier.bonus) }}</text>
      </view>
      <button class="btn primary small" @click="buy(tier.pay, tier.bonus)">{{ tr("topup") }}</button>
    </view>
    <text class="muted">{{ tr("mock_charge") }}</text>
  </view>
</template>
