<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { addToCart, defaultSpecs, makeCatalog, priceLine, unitPrice, withCart, type PricingMode } from "@demo/core";
import { shop, themeStyle } from "@demo/shop";
import { demo, explain, L, money, patch, toast, tr } from "../services/demo";

const props = defineProps<{ productId: string | null; pricing: PricingMode }>();
const emit = defineEmits<{ close: []; added: [] }>();

const specs = ref<Record<string, string>>({});
const addons = ref<string[]>([]);
const qty = ref(1);

const catalog = computed(() => makeCatalog(shop.products, demo.state));
const product = computed(() => catalog.value.products.find((item) => item.id === props.productId) ?? null);

watch(
  () => [props.productId, props.pricing] as const,
  () => {
    if (!product.value) return;
    specs.value = defaultSpecs(product.value);
    addons.value = [];
    qty.value = 1;
  },
  { immediate: true },
);

const unit = computed(() => {
  if (!product.value) return 0;
  try {
    return unitPrice(product.value, { specIds: specs.value, addonIds: addons.value, pricing: props.pricing }, catalog.value);
  } catch {
    return product.value.price;
  }
});

function pickSpec(groupId: string, optionId: string): void {
  specs.value = { ...specs.value, [groupId]: optionId };
}

function toggleAddon(id: string): void {
  addons.value = addons.value.includes(id) ? addons.value.filter((item) => item !== id) : [...addons.value, id];
}

function add(): void {
  if (!product.value || product.value.soldOut) {
    toast(tr("sold_out_toast"));
    return;
  }
  const draft = {
    productId: product.value.id,
    qty: qty.value,
    specIds: { ...specs.value },
    addonIds: [...addons.value],
    pricing: props.pricing,
  };
  try {
    priceLine(catalog.value, { ...draft, lineId: "check" });
    patch((state) => withCart(state, addToCart(state.cart, draft)));
    toast(tr("added"));
    emit("added");
  } catch (error) {
    toast(explain(error));
  }
}
</script>

<template>
  <view v-if="product">
    <view class="mask" @click="emit('close')"></view>
    <view class="sheet" :style="themeStyle">
      <view class="sheet-handle"></view>
      <view class="spread">
        <view>
          <text class="good-name">{{ L(product.name) }}</text>
          <text class="muted">{{ L(product.desc) }}</text>
        </view>
        <text class="thumb" :style="{ background: product.tone, width: '88rpx', height: '88rpx', fontSize: '40rpx' }">{{ product.emoji }}</text>
      </view>
      <view v-for="group in product.specs" :key="group.id">
        <text class="group-label">{{ L(group.name) }}</text>
        <view class="chips">
          <text
            v-for="option in group.options"
            :key="option.id"
            class="chip"
            :class="{ on: specs[group.id] === option.id }"
            @click="pickSpec(group.id, option.id)"
          >
            {{ L(option.name) }}<text v-if="option.priceDelta"> +{{ money(option.priceDelta) }}</text>
          </text>
        </view>
      </view>
      <view v-if="product.addons.length">
        <text class="group-label">{{ tr("optional_addons") }}</text>
        <view class="chips">
          <text
            v-for="addon in product.addons"
            :key="addon.id"
            class="chip"
            :class="{ on: addons.includes(addon.id) }"
            @click="toggleAddon(addon.id)"
          >
            {{ L(addon.name) }} +{{ money(addon.price) }}
          </text>
        </view>
      </view>
      <view class="spread" style="margin-top: 28rpx">
        <view class="stepper">
          <button @click="qty = Math.max(1, qty - 1)">−</button>
          <text>{{ qty }}</text>
          <button @click="qty += 1">+</button>
        </view>
        <text class="price">{{ money(unit * qty) }}</text>
      </view>
      <button class="btn primary block" :disabled="product.soldOut" @click="add">
        {{ product.soldOut ? tr("sold_out") : tr("add_to_cart") }}
      </button>
    </view>
  </view>
</template>
