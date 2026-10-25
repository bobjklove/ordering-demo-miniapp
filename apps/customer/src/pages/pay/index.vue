<script setup lang="ts">
import { computed, ref } from "vue";
import { placePaidOrder, quoteCheckout } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import {
  clearDraft,
  demo,
  explain,
  L,
  levelName,
  loadDraft,
  makeId,
  money,
  patch,
  toast,
  tr,
  useScreen,
} from "../../services/demo";
import { go, tab } from "../../services/nav";

useScreen();
const draft = ref(loadDraft());
const phase = ref<"ready" | "paying" | "done">("ready");
const orderId = ref("");

const preview = computed(() => {
  if (!draft.value) return null;
  try {
    return quoteCheckout(demo.state, shop.products, draft.value, Date.now()).quote;
  } catch {
    return null;
  }
});

const order = computed(() => demo.state.orders.find((item) => item.id === orderId.value) ?? null);

function confirm(): void {
  if (!draft.value) return;
  phase.value = "paying";
  const id = makeId("ord");
  setTimeout(() => {
    try {
      patch((state) => placePaidOrder(state, shop.products, draft.value!, Date.now(), { orderId: id }).state);
      orderId.value = id;
      phase.value = "done";
      clearDraft();
    } catch (error) {
      const placed = demo.state.orders.some((item) => item.id === id);
      console.error("pay-failed", error instanceof Error ? `${error.name}: ${error.message}` : error);
      if (placed) {
        orderId.value = id;
        phase.value = "done";
        clearDraft();
        return;
      }
      phase.value = "ready";
      toast(explain(error));
    }
  }, 700);
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('pay_title')" back />
    <view v-if="!draft && phase !== 'done'" class="empty">
      <text>{{ tr("draft_missing") }}</text>
      <button class="btn primary block" @click="tab('/pages/cart/index')">{{ tr("view_cart") }}</button>
    </view>
    <template v-else-if="phase !== 'done'">
      <view class="ticket">
        <view class="ticket-stripe"></view>
        <view class="ticket-body">
          <text class="muted">{{ tr("mock_pay") }}</text>
          <text class="ticket-no">{{ preview ? money(preview.payable) : "—" }}</text>
          <text class="muted">{{ tr("mock_pay_hint") }}</text>
          <text v-if="preview && preview.payable === 0" class="slogan">{{ tr("free_order") }}</text>
        </view>
      </view>
      <button class="btn primary block" :disabled="phase === 'paying' || !preview" @click="confirm">
        {{ phase === "paying" ? tr("paying") : preview && preview.payable === 0 ? tr("confirm_order") : tr("mock_pay") }}
      </button>
    </template>
    <template v-else-if="order">
      <view class="ticket">
        <view class="ticket-stripe"></view>
        <view class="ticket-body">
          <text class="muted">{{ tr("pickup_no") }}</text>
          <text class="ticket-no">{{ order.pickupNo }}</text>
          <text class="slogan">{{ L(shop.name) }}</text>
          <text>{{ tr("points_earned") }} +{{ order.pointsEarned }}</text>
          <text v-if="order.levelBefore !== order.levelAfter" class="price">{{ tr("new_level") }} · {{ levelName(order.levelAfter) }}</text>
          <text v-else class="muted">{{ tr("same_level") }} · {{ levelName(order.levelAfter) }}</text>
          <text class="muted">{{ tr("success_body") }}</text>
        </view>
      </view>
      <button class="btn primary block" @click="go('/pages/order/index?id=' + order.id)">{{ tr("view_order") }}</button>
      <button class="btn ghost block" @click="tab('/pages/menu/index')">{{ tr("continue_shop") }}</button>
    </template>
  </view>
</template>
