<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { applyOrderAction, cancelOrder, reorderIntoCart } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { demo, explain, formatWhen, L, levelName, money, patch, statusKey, toast, tr, useScreen } from "../../services/demo";
import { go } from "../../services/nav";

useScreen();
const id = ref("");
onLoad((query) => {
  id.value = typeof query?.id === "string" ? query.id : "";
});

const order = computed(() => demo.state.orders.find((item) => item.id === id.value) ?? null);
const steps = ["placed", "preparing", "ready"] as const;

function stepClass(step: string): string {
  if (!order.value || order.value.status === "cancelled") return "";
  const orderIndex = steps.indexOf(order.value.status as (typeof steps)[number]);
  const stepIndex = steps.indexOf(step as (typeof steps)[number]);
  if (order.value.status === "completed" || (orderIndex > -1 && stepIndex < orderIndex)) return "done";
  if (step === order.value.status || (order.value.status === "completed" && step === "ready")) return "on";
  if (order.value.status === "completed") return "done";
  return stepIndex === orderIndex ? "on" : "";
}

function act(action: "complete" | "cancel"): void {
  if (!order.value) return;
  const run = () => {
    try {
      patch((state) => (action === "cancel" ? cancelOrder(state, order.value!.id) : applyOrderAction(state, order.value!.id, "complete")));
      toast(tr(action === "cancel" ? "cancelled_ok" : "picked_ok"));
    } catch (error) {
      toast(explain(error));
    }
  };
  if (action === "cancel") {
    uni.showModal({ title: tr("cancel_order"), content: tr("confirm_cancel"), success: (res) => res.confirm && run() });
    return;
  }
  run();
}

function reorder(): void {
  if (!order.value) return;
  let skipped: string[] = [];
  patch((state) => {
    const result = reorderIntoCart(state, shop.products, order.value!);
    skipped = result.skipped;
    return result.state;
  });
  toast(skipped.length ? tr("skipped") : tr("reorder_done"));
  go("/pages/cart/index");
}

function fulfillmentText(): string {
  if (!order.value) return "";
  if (order.value.fulfillment === "dinein") return `${tr("dinein")} ${order.value.tableCode}`;
  if (order.value.fulfillment === "delivery") return `${tr("delivery")} ${order.value.deliveryAddress}`;
  return tr("pickup");
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('order_title')" back />
    <view v-if="!order" class="empty">{{ tr("order_missing") }}</view>
    <template v-else>
      <view class="ticket">
        <view class="ticket-stripe"></view>
        <view class="ticket-body">
          <text class="muted">{{ tr("pickup_no") }}</text>
          <text class="ticket-no">{{ order.pickupNo }}</text>
          <text class="tag">{{ tr(statusKey(order.status)) }}</text>
        </view>
      </view>
      <view v-if="order.status !== 'cancelled'" class="steps">
        <view v-for="step in steps" :key="step" class="step" :class="stepClass(step)">{{ tr(statusKey(step)) }}</view>
      </view>
      <text class="muted">{{ tr("sync_admin") }}</text>
      <view class="card">
        <view class="kv"><text>{{ tr("placed_at") }}</text><text>{{ formatWhen(order.createdAt) }}</text></view>
        <view class="kv"><text>{{ tr("fulfillment") }}</text><text>{{ fulfillmentText() }}</text></view>
        <view class="kv"><text>{{ tr("pickup_time") }}</text><text>{{ order.pickupTime === "ASAP" ? tr("asap") : order.pickupTime }}</text></view>
        <view class="kv"><text>{{ tr("method") }}</text><text>{{ tr(order.payMethod === "wallet" ? "pay_wallet" : order.payMethod === "mixed" ? "pay_mixed" : "pay_mock") }}</text></view>
        <view v-if="order.note" class="kv"><text>{{ tr("note") }}</text><text>{{ order.note }}</text></view>
      </view>
      <view class="card">
        <view v-for="line in order.lines" :key="line.lineId" class="kv">
          <text>{{ L(line.name) }} {{ tr("qty_short") }}{{ line.qty }}</text>
          <text>{{ money(line.lineTotal) }}</text>
        </view>
        <view v-if="order.discount" class="kv"><text>{{ tr("discount") }}</text><text>-{{ money(order.discount) }}</text></view>
        <view class="kv"><text>{{ tr("payable") }}</text><text class="price">{{ money(order.payable) }}</text></view>
        <view class="kv"><text>{{ tr("points_earned") }}</text><text>+{{ order.pointsEarned }}</text></view>
        <view class="kv"><text>{{ tr("level") }}</text><text>{{ levelName(order.levelAfter) }}</text></view>
      </view>
      <view v-if="order.receipt" class="card">
        <text class="section">{{ tr("receipt") }}</text>
        <text>{{ order.receipt.name }} · {{ order.receipt.email }}</text>
        <text v-if="order.receipt.taxId" class="muted">{{ order.receipt.taxId }}</text>
      </view>
      <button v-if="order.status === 'ready'" class="btn leaf block" @click="act('complete')">{{ tr("i_picked") }}</button>
      <button v-if="order.status === 'placed' || order.status === 'preparing'" class="btn ghost block" @click="act('cancel')">{{ tr("cancel_order") }}</button>
      <button class="btn primary block" @click="reorder">{{ tr("reorder") }}</button>
    </template>
  </view>
</template>
