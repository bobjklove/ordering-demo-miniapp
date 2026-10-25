<script setup lang="ts">
import { ref } from "vue";
import { saveReceipt, type ReceiptInfo } from "@demo/core";
import { themeStyle } from "@demo/shop";
import NavBar from "../../components/NavBar.vue";
import { demo, patch, readValue, toast, tr, useScreen } from "../../services/demo";

useScreen();
const current = demo.state.member.receipt;
const kind = ref<ReceiptInfo["kind"]>(current?.kind ?? "personal");
const title = ref(current?.title ?? "");
const name = ref(current?.name ?? demo.state.member.name);
const email = ref(current?.email ?? "");
const taxId = ref(current?.taxId ?? "");

function save(): void {
  patch((state) =>
    saveReceipt(state, {
      kind: kind.value,
      title: title.value.trim(),
      name: name.value.trim(),
      email: email.value.trim(),
      taxId: taxId.value.trim(),
    }),
  );
  toast(tr("receipt_saved"));
}
</script>

<template>
  <view class="page" :style="themeStyle">
    <NavBar :title="tr('receipt_page')" back />
    <view class="seg">
      <text :class="{ on: kind === 'personal' }" @click="kind = 'personal'">{{ tr("receipt_personal") }}</text>
      <text :class="{ on: kind === 'business' }" @click="kind = 'business'">{{ tr("receipt_business") }}</text>
    </view>
    <text class="group-label">{{ tr("receipt_title") }}</text>
    <input class="field" :value="title" @input="title = readValue($event)" />
    <text class="group-label">{{ tr("receipt_name") }}</text>
    <input class="field" :value="name" @input="name = readValue($event)" />
    <text class="group-label">{{ tr("receipt_email") }}</text>
    <input class="field" :value="email" @input="email = readValue($event)" />
    <text class="group-label">{{ tr("receipt_tax") }}</text>
    <input class="field" :value="taxId" @input="taxId = readValue($event)" />
    <button class="btn primary block" @click="save">{{ tr("save") }}</button>
  </view>
</template>
