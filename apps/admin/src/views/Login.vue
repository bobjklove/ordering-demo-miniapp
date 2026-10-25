<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { shop } from "@demo/shop";
import { armAudio, rememberSound } from "../audio";
import { demo, login, setLocale, tr } from "../demo";

const router = useRouter();
const user = ref(shop.adminUser);
const password = ref("");
const error = ref("");

function submit(): void {
  if (!login(user.value, password.value)) {
    error.value = tr("wrong_login");
    return;
  }
  armAudio();
  rememberSound(true);
  router.push("/orders");
}

function enter(): void {
  user.value = shop.adminUser;
  password.value = shop.adminPassword;
  submit();
}
</script>

<template>
  <div class="login-wrap">
    <form class="card login" @submit.prevent="submit">
      <div class="spread">
        <h1>{{ tr("login_title") }}</h1>
        <button class="ghost" type="button" @click="setLocale(demo.locale === 'zh' ? 'en' : 'zh')">
          {{ demo.locale === "zh" ? "EN" : "中" }}
        </button>
      </div>
      <p class="muted">{{ shop.name[demo.locale] }} · {{ tr("login_hint") }}</p>
      <p class="creds">{{ shop.adminUser }} / {{ shop.adminPassword }}</p>
      <label>{{ tr("username") }}</label>
      <input v-model="user" autocomplete="username" />
      <label>{{ tr("password") }}</label>
      <input v-model="password" type="password" autocomplete="current-password" />
      <p v-if="error" class="warn">{{ error }}</p>
      <div class="row" style="margin-top: 16px">
        <button class="btn" type="button" @click="enter">{{ tr("enter_demo") }}</button>
        <button class="ghost" type="submit">{{ tr("enter") }}</button>
      </div>
    </form>
  </div>
</template>
