<script setup lang="ts">
import { computed, reactive } from "vue";
import { makeCatalog, setPrice, setShelf, setSoldOut, setSpecDelta } from "@demo/core";
import { shop } from "@demo/shop";
import { centsInput, demo, explain, L, patch, readCents, tr } from "../demo";

const catalog = computed(() => makeCatalog(shop.products, demo.state));
const prices = reactive<Record<string, string>>({});
const deltas = reactive<Record<string, string>>({});
const note = reactive({ text: "" });

for (const product of catalog.value.products) {
  prices[product.id] = centsInput(product.price);
  for (const group of product.specs) {
    for (const option of group.options) deltas[`${product.id}:${option.id}`] = centsInput(option.priceDelta);
  }
}

function savePrice(id: string): void {
  const cents = readCents(prices[id] || "");
  if (cents == null) {
    note.text = tr("price_bad");
    return;
  }
  try {
    patch((state) => setPrice(state, id, cents));
    note.text = tr("saved");
  } catch (error) {
    note.text = explain(error);
  }
}

function saveDelta(productId: string, optionId: string): void {
  const cents = readCents(deltas[`${productId}:${optionId}`] || "");
  if (cents == null) {
    note.text = tr("price_bad");
    return;
  }
  try {
    patch((state) => setSpecDelta(state, productId, optionId, cents));
    note.text = tr("saved");
  } catch (error) {
    note.text = explain(error);
  }
}

function toggleShelf(id: string, onShelf: boolean): void {
  patch((state) => setShelf(state, id, !onShelf));
}

function toggleSold(id: string, soldOut: boolean): void {
  patch((state) => setSoldOut(state, id, !soldOut));
}
</script>

<template>
  <section>
    <h1>{{ tr("products") }}</h1>
    <p class="sub">{{ tr("product_hint") }}</p>
    <p v-if="note.text" class="muted">{{ note.text }}</p>
    <article v-for="product in catalog.products" :key="product.id" class="card product">
      <div class="spread">
        <div>
          <strong>{{ product.emoji }} {{ L(product.name) }}</strong>
          <p class="muted">{{ L(product.desc) }}</p>
        </div>
        <div class="row">
          <button class="ghost" @click="toggleShelf(product.id, product.onShelf)">{{ product.onShelf ? tr("shelf_off") : tr("shelf_on") }}</button>
          <button class="ghost" @click="toggleSold(product.id, product.soldOut)">{{ product.soldOut ? tr("in_stock") : tr("sold") }}</button>
        </div>
      </div>
      <div class="fields">
        <div>
          <label>{{ tr("base_price") }}</label>
          <input v-model="prices[product.id]" />
          <button class="btn" style="margin-top: 8px" @click="savePrice(product.id)">{{ tr("save_price") }}</button>
        </div>
        <div v-for="group in product.specs" :key="group.id">
          <label>{{ L(group.name) }}</label>
          <div v-for="option in group.options" :key="option.id" class="row">
            <span>{{ L(option.name) }}</span>
            <input v-model="deltas[product.id + ':' + option.id]" />
            <button class="ghost" @click="saveDelta(product.id, option.id)">{{ tr("save") }}</button>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
