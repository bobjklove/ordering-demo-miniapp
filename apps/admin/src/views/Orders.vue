<script setup lang="ts">
import { computed, ref } from "vue";
import { applyOrderAction, cancelOrder, type OrderStatus } from "@demo/core";
import { demo, explain, L, money, patch, tr } from "../demo";
import { printTicket } from "../print";

const filter = ref<"all" | OrderStatus>("all");
const note = ref("");
const filters = [
  { id: "all", key: "filter_all" },
  { id: "placed", key: "filter_placed" },
  { id: "preparing", key: "filter_preparing" },
  { id: "ready", key: "filter_ready" },
  { id: "completed", key: "filter_done" },
  { id: "cancelled", key: "filter_cancelled" },
] as const;

const orders = computed(() => demo.state.orders.filter((order) => filter.value === "all" || order.status === filter.value));

function act(id: string, action: "accept" | "ready" | "complete" | "cancel"): void {
  try {
    patch((state) => (action === "cancel" ? cancelOrder(state, id) : applyOrderAction(state, id, action)));
    note.value = tr(action === "accept" ? "accept_ok" : action === "ready" ? "ready_ok" : action === "complete" ? "done_ok" : "cancelled_ok");
  } catch (error) {
    note.value = explain(error);
  }
}

function printOrder(id: string): void {
  const order = demo.state.orders.find((item) => item.id === id);
  if (!order) return;
  const ok = printTicket(order, demo.locale, money);
  note.value = ok ? tr("print_opened") : tr("print_failed");
}

function statusLabel(status: string): string {
  return tr(`status_${status}` as "status_placed");
}

function when(ts: number): string {
  const date = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}
</script>

<template>
  <section>
    <div class="spread">
      <h1>{{ tr("orders") }}</h1>
    </div>
    <div class="filters">
      <button v-for="item in filters" :key="item.id" class="chip" :class="{ on: filter === item.id }" @click="filter = item.id">
        {{ tr(item.key) }}
      </button>
    </div>
    <p v-if="note" class="muted">{{ note }}</p>
    <p v-if="!orders.length" class="muted">{{ tr("no_orders") }}</p>
    <article v-for="order in orders" :key="order.id" class="order" :class="{ new: order.status === 'placed' }">
      <div class="spread">
        <h2 class="pickup">{{ order.pickupNo }}</h2>
        <span class="tag">{{ statusLabel(order.status) }}</span>
      </div>
      <p class="muted">
        {{ when(order.createdAt) }} · {{ tr(order.fulfillment === "dinein" ? "dinein" : order.fulfillment === "delivery" ? "delivery" : "pickup") }}
        <template v-if="order.tableCode"> {{ order.tableCode }}</template>
        <template v-if="order.deliveryAddress"> {{ order.deliveryAddress }}</template>
        · {{ order.pickupTime === "ASAP" ? tr("asap") : order.pickupTime }}
      </p>
      <p v-for="line in order.lines" :key="line.lineId">
        {{ L(line.name) }} × {{ line.qty }}
        <span class="muted">{{ [line.specSummary[demo.locale], line.addonSummary[demo.locale]].filter(Boolean).join(" · ") }}</span>
        <span class="mini"> {{ money(line.lineTotal) }}</span>
      </p>
      <p v-if="order.note"><strong>{{ tr("customer_note") }}:</strong> {{ order.note }}</p>
      <p class="mini">{{ tr("payable") }} {{ money(order.payable) }} · {{ tr("points_earned") }} +{{ order.pointsEarned }}</p>
      <div class="row">
        <button v-if="order.status === 'placed'" class="btn" @click="act(order.id, 'accept')">{{ tr("accept") }}</button>
        <button v-if="order.status === 'preparing'" class="btn" @click="act(order.id, 'ready')">{{ tr("mark_ready") }}</button>
        <button v-if="order.status === 'ready'" class="ghost" @click="act(order.id, 'complete')">{{ tr("mark_done") }}</button>
        <button v-if="order.status === 'placed' || order.status === 'preparing'" class="danger" @click="act(order.id, 'cancel')">{{ tr("cancel") }}</button>
        <button class="ghost" @click="printOrder(order.id)">{{ tr("print") }}</button>
      </div>
    </article>
  </section>
</template>
