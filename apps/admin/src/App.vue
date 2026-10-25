<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { applyOrderAction, incomingPlacedOrders } from "@demo/core";
import { shop } from "@demo/shop";
import { armAudio, audioUnlocked, chime, rememberSound, soundRemembered } from "./audio";
import { demo, L, logout, money, patch, resetDemo, setLocale, tr } from "./demo";

const route = useRoute();
const router = useRouter();
const armed = ref(soundRemembered());
const askSound = ref(false);
const known = new Set<string>();
const ready = ref(false);
const queue = ref<string[]>([]);
const alertId = ref<string | null>(null);

const alertOrder = computed(() => demo.state.orders.find((order) => order.id === alertId.value) ?? null);
const pending = computed(() => demo.state.orders.filter((order) => order.status === "placed" || order.status === "preparing").length);
const links = [
  { to: "/dashboard", key: "dash" as const },
  { to: "/orders", key: "orders" as const },
  { to: "/products", key: "products" as const },
  { to: "/members", key: "members" as const },
  { to: "/marketing", key: "marketing" as const },
];

function syncSoundGate(): void {
  if (route.path === "/login") return;
  armed.value = soundRemembered();
  askSound.value = !audioUnlocked();
}

onMounted(() => {
  for (const order of demo.state.orders) known.add(order.id);
  ready.value = true;
  syncSoundGate();
});

watch(() => route.path, syncSoundGate);

watch(
  () => demo.state.orders.map((order) => `${order.id}:${order.status}`).join(","),
  () => {
    if (!ready.value) return;
    const fresh = incomingPlacedOrders(known, demo.state.orders);
    if (!fresh.length) return;
    for (const id of fresh) known.add(id);
    queue.value = [...queue.value, ...fresh];
    if (!alertId.value) alertId.value = queue.value.shift() ?? null;
    if (armed.value && audioUnlocked()) chime();
  },
);

function showNext(): void {
  alertId.value = queue.value.shift() ?? null;
  if (alertId.value && armed.value && audioUnlocked()) chime();
}

function enableFromGate(): void {
  if (!armAudio()) return;
  rememberSound(true);
  armed.value = true;
  askSound.value = false;
  chime();
}

function enableSound(): void {
  if (!armAudio()) return;
  rememberSound(true);
  armed.value = true;
  askSound.value = false;
  chime();
}

function mute(): void {
  armed.value = false;
  rememberSound(false);
}

function poke(): void {
  if (armed.value && !audioUnlocked()) armAudio();
}

function acceptAlert(): void {
  const id = alertOrder.value?.id;
  if (!id) return;
  patch((state) => applyOrderAction(state, id, "accept"));
  showNext();
}

function viewAlert(): void {
  router.push("/orders");
  showNext();
}

function exit(): void {
  logout();
  router.push("/login");
}

function reset(): void {
  if (!window.confirm(tr("reset_body"))) return;
  resetDemo();
}
</script>

<template>
  <RouterView v-if="route.path === '/login'" />
  <div v-else class="shell" @pointerdown="poke">
    <aside class="side">
      <div class="brand">
        <span class="seal">{{ shop.logoText }}</span>
        <div>
          <strong>{{ shop.name[demo.locale] }}</strong>
          <small>{{ tr("shop_admin") }}</small>
        </div>
      </div>
      <nav>
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">
          {{ tr(link.key) }}
          <em v-if="link.to === '/orders' && pending">{{ pending }}</em>
        </RouterLink>
      </nav>
      <div class="side-foot">
        <button v-if="!armed" class="sound" @click="enableSound">{{ tr("enable_sound") }}</button>
        <button v-else class="sound on" @click="mute">{{ tr("mute") }}</button>
        <p class="hint">{{ armed ? tr("sound_armed") : tr("sound_need") }}</p>
        <button class="text" @click="setLocale(demo.locale === 'zh' ? 'en' : 'zh')">{{ demo.locale === "zh" ? "English" : "中文" }}</button>
        <a class="text" href="/" target="_blank" rel="noreferrer">{{ tr("open_store") }}</a>
        <button class="text" @click="reset">{{ tr("reset") }}</button>
        <button class="text" @click="exit">{{ tr("logout") }}</button>
      </div>
    </aside>
    <main>
      <RouterView />
    </main>
    <div v-if="askSound" class="gate">
      <div class="gate-card">
        <h2>{{ tr(soundRemembered() ? "sound_resume" : "sound_gate_title") }}</h2>
        <p>{{ tr(soundRemembered() ? "sound_resume_body" : "sound_gate_body") }}</p>
        <button class="btn" type="button" @click="enableFromGate">{{ tr("enable_sound") }}</button>
      </div>
    </div>
    <div v-else-if="alertOrder" class="gate">
      <div class="gate-card">
        <p class="muted">{{ tr("new_order") }}</p>
        <h2 class="pickup">{{ alertOrder.pickupNo }}</h2>
        <p v-for="line in alertOrder.lines" :key="line.lineId" class="alert-line">
          <span>{{ L(line.name) }} × {{ line.qty }}</span>
          <span class="mini">{{ money(line.lineTotal) }}</span>
        </p>
        <p class="alert-total">{{ tr("payable") }} {{ money(alertOrder.payable) }}</p>
        <div class="row">
          <button class="btn" type="button" @click="acceptAlert">{{ tr("accept") }}</button>
          <button class="ghost" type="button" @click="viewAlert">{{ tr("alert_view") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
