<script setup lang="ts">
import { reactive } from "vue";
import { clearGroups, extendFlashIfExpired, issueCoupon, setFlash, setGroupCampaign } from "@demo/core";
import { shop } from "@demo/shop";
import { centsInput, demo, explain, L, patch, readCents, tr } from "../demo";

function localId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const note = reactive({ text: "" });
const group = reactive({
  price: centsInput(demo.state.groupCampaign.price),
  need: String(demo.state.groupCampaign.need),
  active: demo.state.groupCampaign.active,
});
const flash = reactive({
  price: centsInput(demo.state.flash.price),
  stock: String(demo.state.flash.stockLeft),
  active: demo.state.flash.active,
});

function issue(templateId: string): void {
  const template = shop.couponTemplates.find((item) => item.id === templateId);
  if (!template) return;
  patch((state) => issueCoupon(state, template, Date.now(), localId("c")));
  note.text = tr("issue_ok");
}

function saveGroup(): void {
  const price = readCents(group.price);
  const need = Number(group.need);
  if (price == null) {
    note.text = tr("price_bad");
    return;
  }
  try {
    patch((state) => setGroupCampaign(state, { price, need, active: group.active }));
    note.text = tr("saved");
  } catch (error) {
    note.text = explain(error);
  }
}

function saveFlash(): void {
  const price = readCents(flash.price);
  const stockLeft = Number(flash.stock);
  if (price == null || !Number.isInteger(stockLeft)) {
    note.text = tr("price_bad");
    return;
  }
  try {
    patch((state) => setFlash(state, { price, stockLeft, active: flash.active }));
    note.text = tr("saved");
  } catch (error) {
    note.text = explain(error);
  }
}

function resetTimer(): void {
  patch((state) => extendFlashIfExpired({ ...state, flash: { ...state.flash, endsAt: 0, active: true } }, Date.now(), shop.flashDurationMs));
  note.text = tr("saved");
}

function wipeGroup(): void {
  patch((state) => clearGroups(state));
  note.text = tr("group_cleared");
}
</script>

<template>
  <section>
    <h1>{{ tr("marketing") }}</h1>
    <p class="sub">{{ tr("marketing_hint") }}</p>
    <p v-if="note.text" class="muted">{{ note.text }}</p>
    <article class="card">
      <h2>{{ tr("coupon_templates") }}</h2>
      <div v-for="template in shop.couponTemplates" :key="template.id" class="spread order">
        <div>
          <strong>{{ L(template.name) }}</strong>
          <p class="muted">-{{ (template.amountOff / 100).toFixed(2) }} · {{ tr("min_spend") }} {{ (template.minSpend / 100).toFixed(2) }} · {{ template.daysValid }} {{ tr("days") }}</p>
        </div>
        <button class="btn" @click="issue(template.id)">{{ tr("issue") }}</button>
      </div>
    </article>
    <article class="card">
      <h2>{{ tr("group_config") }}</h2>
      <p class="muted">{{ L(shop.products.find((item) => item.id === demo.state.groupCampaign.productId)?.name || { zh: "", en: "" }) }}</p>
      <div class="fields">
        <div><label>{{ tr("group_price_label") }}</label><input v-model="group.price" /></div>
        <div><label>{{ tr("need_people") }}</label><input v-model="group.need" /></div>
        <div><label>{{ tr("active") }}</label><input type="checkbox" v-model="group.active" /></div>
      </div>
      <div class="row" style="margin-top: 12px">
        <button class="btn" @click="saveGroup">{{ tr("save") }}</button>
        <button class="ghost" @click="wipeGroup">{{ tr("clear_group") }}</button>
      </div>
      <p v-for="item in demo.state.groups" :key="item.id" class="muted">{{ item.joined }}/{{ item.need }} · {{ item.status }}</p>
    </article>
    <article class="card">
      <h2>{{ tr("flash_config") }}</h2>
      <p class="muted">{{ L(shop.products.find((item) => item.id === demo.state.flash.productId)?.name || { zh: "", en: "" }) }}</p>
      <div class="fields">
        <div><label>{{ tr("flash_price_label") }}</label><input v-model="flash.price" /></div>
        <div><label>{{ tr("stock_left") }}</label><input v-model="flash.stock" /></div>
        <div><label>{{ tr("active") }}</label><input type="checkbox" v-model="flash.active" /></div>
      </div>
      <div class="row" style="margin-top: 12px">
        <button class="btn" @click="saveFlash">{{ tr("save") }}</button>
        <button class="ghost" @click="resetTimer">{{ tr("reset_timer") }}</button>
      </div>
    </article>
  </section>
</template>
