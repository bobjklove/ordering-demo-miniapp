<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { normalizeTable, pickupSlots, quoteCheckout, type Fulfillment } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { demo, explain, L, money, readValue, refreshDemo, saveDraft, toast, tr, useScreen } from "../../services/demo";
import { go } from "../../services/nav";

useScreen();
const fulfillment = ref<Fulfillment>("pickup");
const tableCode = ref(demo.state.pendingTable || "T3");
const address = ref("");
const note = ref("");
const pickupTime = ref("ASAP");
const couponId = ref("");
const usePoints = ref(false);
const useWallet = ref(false);
const attachReceipt = ref(Boolean(demo.state.member.receipt));
const slots = ref(pickupSlots(Date.now()));

onShow(() => {
  refreshDemo();
  slots.value = pickupSlots(Date.now());
  if (!tableCode.value && demo.state.pendingTable) tableCode.value = demo.state.pendingTable;
});

const coupons = computed(() =>
  demo.state.coupons.filter((coupon) => coupon.memberId === demo.state.member.id && !coupon.used && coupon.expiresAt > Date.now()),
);

const quoteState = computed(() => {
  if (!demo.state.cart.length) return { quote: null, error: "" };
  try {
    const quote = quoteCheckout(
      demo.state,
      shop.products,
      {
        lines: demo.state.cart,
        fulfillment: fulfillment.value,
        couponId: couponId.value,
        redeemPoints: usePoints.value ? demo.state.member.points : 0,
        useWallet: useWallet.value,
      },
      Date.now(),
    ).quote;
    return { quote, error: "" };
  } catch (error) {
    return { quote: null, error: explain(error) };
  }
});
const preview = computed(() => quoteState.value.quote);
const quoteError = computed(() => quoteState.value.error);

function chooseCoupon(id: string): void {
  if (couponId.value === id) {
    couponId.value = "";
    return;
  }
  const coupon = coupons.value.find((item) => item.id === id);
  const subtotal = preview.value?.subtotal ?? 0;
  if (coupon && subtotal && subtotal < coupon.minSpend && couponId.value === "") {
    toast(tr("coupon_need"));
  }
  couponId.value = id;
}

function pay(): void {
  if (!demo.state.member.registered) {
    toast(tr("need_member"));
    go("/pages/me/index");
    return;
  }
  if (fulfillment.value === "dinein" && !normalizeTable(tableCode.value)) {
    toast(tr("need_table"));
    return;
  }
  if (fulfillment.value === "delivery" && address.value.trim().length < 4) {
    toast(tr("need_address"));
    return;
  }
  if (!pickupTime.value) {
    toast(tr("need_time"));
    return;
  }
  if (!preview.value) {
    toast(quoteError.value || tr("err_generic"));
    return;
  }
  saveDraft({
    lines: demo.state.cart.map((line) => ({ ...line, specIds: { ...line.specIds }, addonIds: [...line.addonIds] })),
    fulfillment: fulfillment.value,
    tableCode: tableCode.value,
    deliveryAddress: address.value,
    note: note.value,
    pickupTime: pickupTime.value,
    couponId: couponId.value,
    redeemPoints: usePoints.value ? demo.state.member.points : 0,
    useWallet: useWallet.value,
    receipt: attachReceipt.value ? demo.state.member.receipt : null,
  });
  go("/pages/pay/index");
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('checkout_title')" back />
    <view v-if="!demo.state.cart.length" class="empty">{{ tr("cart_empty") }}</view>
    <template v-else>
      <view class="seg">
        <text :class="{ on: fulfillment === 'pickup' }" @click="fulfillment = 'pickup'">{{ tr("pickup") }}</text>
        <text :class="{ on: fulfillment === 'dinein' }" @click="fulfillment = 'dinein'">{{ tr("dinein") }}</text>
        <text :class="{ on: fulfillment === 'delivery' }" @click="fulfillment = 'delivery'">{{ tr("delivery") }}</text>
      </view>
      <view class="card">
        <text v-if="fulfillment === 'pickup'" class="muted">{{ tr("pickup_hint") }}</text>
        <template v-if="fulfillment === 'dinein'">
          <text class="muted">{{ tr("dinein_hint") }}</text>
          <input class="field" :value="tableCode" :placeholder="tr('table_ph')" @input="tableCode = readValue($event)" />
          <view class="chips">
            <text v-for="code in shop.tableCodes" :key="code" class="chip" :class="{ on: tableCode.toUpperCase() === code }" @click="tableCode = code">
              {{ code }}
            </text>
          </view>
        </template>
        <template v-if="fulfillment === 'delivery'">
          <text class="muted">{{ tr("delivery_hint") }}</text>
          <input class="field" :value="address" :placeholder="tr('address_ph')" @input="address = readValue($event)" />
        </template>
        <text class="group-label">{{ tr("pickup_time") }}</text>
        <view class="chips">
          <text v-for="slot in slots" :key="slot" class="chip" :class="{ on: pickupTime === slot }" @click="pickupTime = slot">
            {{ slot === "ASAP" ? tr("asap") : slot }}
          </text>
        </view>
        <text class="group-label">{{ tr("note") }}</text>
        <textarea class="area" :value="note" :placeholder="tr('note_ph')" maxlength="80" @input="note = readValue($event)" />
      </view>
      <view class="card">
        <text class="section">{{ tr("coupon") }}</text>
        <view class="chip" :class="{ on: couponId === '' }" @click="couponId = ''">{{ tr("no_coupon") }}</view>
        <view v-for="coupon in coupons" :key="coupon.id" class="spread" style="margin-top: 14rpx" @click="chooseCoupon(coupon.id)">
          <view>
            <text>{{ L(coupon.name) }} · -{{ money(coupon.amountOff) }}</text>
            <text class="muted">{{ tr("coupon_min") }} {{ money(coupon.minSpend) }}</text>
          </view>
          <text class="tag">{{ couponId === coupon.id ? tr("selected") : tr("select") }}</text>
        </view>
      </view>
      <view class="card">
        <view class="spread">
          <view>
            <text>{{ tr("use_points") }}</text>
            <text class="muted">{{ tr("balance") }} {{ demo.state.member.points }} · {{ tr("redeem_cap") }}</text>
          </view>
          <view class="switch" :class="{ on: usePoints }" @click="usePoints = !usePoints"><view class="knob"></view></view>
        </view>
        <view class="spread" style="margin-top: 18rpx">
          <view>
            <text>{{ tr("use_wallet") }}</text>
            <text class="muted">{{ money(demo.state.member.walletBalance) }}</text>
          </view>
          <view class="switch" :class="{ on: useWallet }" @click="useWallet = !useWallet"><view class="knob"></view></view>
        </view>
        <view class="spread" style="margin-top: 18rpx">
          <text>{{ tr("attach_receipt") }}</text>
          <view class="switch" :class="{ on: attachReceipt }" @click="attachReceipt = !attachReceipt"><view class="knob"></view></view>
        </view>
        <text class="info-a" @click="go('/pages/receipt/index')">{{ tr("edit_receipt") }}</text>
      </view>
      <view v-if="preview" class="card">
        <view class="kv"><text>{{ tr("subtotal") }}</text><text>{{ money(preview.subtotal) }}</text></view>
        <view v-if="preview.deliveryFee" class="kv"><text>{{ tr("fee") }}</text><text>{{ money(preview.deliveryFee) }}</text></view>
        <view v-if="preview.discount" class="kv"><text>{{ tr("discount") }}</text><text>-{{ money(preview.discount) }}</text></view>
        <view v-if="preview.pointsValue" class="kv"><text>{{ tr("points_applied") }}</text><text>-{{ money(preview.pointsValue) }}</text></view>
        <view v-if="preview.walletApplied" class="kv"><text>{{ tr("wallet_applied") }}</text><text>-{{ money(preview.walletApplied) }}</text></view>
        <view class="kv"><text>{{ tr("earn_preview") }}</text><text>+{{ preview.pointsEarn }}</text></view>
        <view class="kv"><text>{{ tr("payable") }}</text><text class="price">{{ money(preview.payable) }}</text></view>
      </view>
      <text v-if="quoteError" class="warn">{{ quoteError }}</text>
      <button class="btn primary block" @click="pay">{{ preview ? tr("pay_now") + " " + money(preview.payable) : tr("pay_now") }}</button>
    </template>
  </view>
</template>
