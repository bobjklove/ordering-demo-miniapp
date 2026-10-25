import {
  DemoError,
  createBrowserKv,
  createStore,
  dollarsToCents,
  extendFlashIfExpired,
  formatMoney,
  formatRate,
  type DemoState,
  type Locale,
  type Localized,
} from "@demo/core";
import { createInitialState, messages, shop, t, themeStyle, type MessageKey } from "@demo/shop";
import { reactive } from "vue";

const kv = createBrowserKv(shop.channelName);
if (!kv) throw new Error("The admin demo runs in a browser.");

const seed = createInitialState();
export const store = createStore({ key: shop.storageKey, seed, kv });
const extended = extendFlashIfExpired(store.get(), Date.now(), shop.flashDurationMs);
if (extended.flash.endsAt !== store.get().flash.endsAt) store.reset(extended);

const savedLocale = localStorage.getItem("nf-admin-locale");
export const demo = reactive({
  state: store.get() as DemoState,
  locale: (savedLocale === "en" ? "en" : "zh") as Locale,
  authed: sessionStorage.getItem("nf-admin-auth") === "1",
});

store.subscribe((state) => {
  demo.state = state;
});

export function patch(fn: (state: DemoState) => DemoState): DemoState {
  return store.update(fn);
}

export function resetDemo(): void {
  store.reset(extendFlashIfExpired(createInitialState(), Date.now(), shop.flashDurationMs));
}

export function setLocale(locale: Locale): void {
  demo.locale = locale;
  localStorage.setItem("nf-admin-locale", locale);
}

export function tr(key: MessageKey): string {
  return t(demo.locale, key);
}

export function L(value: Localized): string {
  return value[demo.locale];
}

export function money(cents: number): string {
  return formatMoney(cents, shop.currencySymbol);
}

export function rate(value: number): string {
  return formatRate(value);
}

export function explain(error: unknown): string {
  const code = error instanceof DemoError ? error.code : "generic";
  const key = `err_${code}` as MessageKey;
  const dict = messages[demo.locale];
  return key in dict ? dict[key] : dict.err_generic;
}

export function login(user: string, password: string): boolean {
  const ok = user.trim() === shop.adminUser && password === shop.adminPassword;
  demo.authed = ok;
  if (ok) sessionStorage.setItem("nf-admin-auth", "1");
  return ok;
}

export function logout(): void {
  demo.authed = false;
  sessionStorage.removeItem("nf-admin-auth");
}

export function centsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function readCents(input: string): number | null {
  return dollarsToCents(input);
}

export { shop, themeStyle };
