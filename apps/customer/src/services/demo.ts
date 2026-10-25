import { onShow } from "@dcloudio/uni-app";
import {
  DemoError,
  createBrowserKv,
  createStore,
  extendFlashIfExpired,
  formatMoney,
  type CartLine,
  type CheckoutInput,
  type DemoState,
  type KeyValue,
  type Locale,
  type Localized,
} from "@demo/core";
import { createInitialState, messages, shop, t, type MessageKey } from "@demo/shop";
import { reactive } from "vue";

const LOCALE_KEY = "nf-locale";
const DRAFT_KEY = "nf-demo:nanfeng:draft";

export interface CheckoutDraft extends CheckoutInput {
  lines: CartLine[];
}

function readLocale(): Locale {
  try {
    if (typeof localStorage !== "undefined") {
      const value = localStorage.getItem(LOCALE_KEY);
      if (value === "en" || value === "zh") return value;
    }
  } catch {
    /* ignore */
  }
  try {
    const value = uni.getStorageSync(LOCALE_KEY);
    if (value === "en" || value === "zh") return value;
  } catch {
    /* ignore */
  }
  return "zh";
}

function uniKv(): KeyValue {
  return {
    read: (key) => {
      const value = uni.getStorageSync(key);
      return typeof value === "string" && value ? value : null;
    },
    write: (key, value) => {
      uni.setStorageSync(key, value);
    },
  };
}

const seed = createInitialState();
export const store = createStore({
  key: shop.storageKey,
  seed,
  kv: createBrowserKv(shop.channelName) ?? uniKv(),
});

const extended = extendFlashIfExpired(store.get(), Date.now(), shop.flashDurationMs);
if (extended.flash.endsAt !== store.get().flash.endsAt) store.reset(extended);

export const demo = reactive({
  state: store.get() as DemoState,
  locale: readLocale() as Locale,
});

store.subscribe((next) => {
  try {
    demo.state = next;
  } catch (error) {
    console.error("demo-state", error instanceof Error ? `${error.name}: ${error.message}` : error);
  }
});

export function refreshDemo(): void {
  demo.state = store.get();
}

export function patch(fn: (state: DemoState) => DemoState): DemoState {
  return store.update(fn);
}

export function resetDemo(): void {
  store.reset(extendFlashIfExpired(createInitialState(), Date.now(), shop.flashDurationMs));
  refreshDemo();
}

export function setLocale(locale: Locale): void {
  demo.locale = locale;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
  try {
    uni.setStorageSync(LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
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

export function explain(error: unknown): string {
  const code = error instanceof DemoError ? error.code : "generic";
  const key = `err_${code}` as MessageKey;
  const dict = messages[demo.locale];
  return key in dict ? dict[key] : dict.err_generic;
}

export function toast(title: string): void {
  uni.showToast({ title, icon: "none", duration: 2200 });
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function readValue(event: unknown): string {
  const detail = (event as { detail?: { value?: string } }).detail;
  return detail?.value ?? "";
}

export function saveDraft(draft: CheckoutDraft): void {
  const raw = JSON.stringify(draft);
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(DRAFT_KEY, raw);
  } catch {
    /* ignore */
  }
  try {
    uni.setStorageSync(DRAFT_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function loadDraft(): CheckoutDraft | null {
  try {
    const fromSession = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(DRAFT_KEY) : null;
    const raw = fromSession || uni.getStorageSync(DRAFT_KEY);
    if (typeof raw === "string" && raw) return JSON.parse(raw) as CheckoutDraft;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearDraft(): void {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
  try {
    uni.removeStorageSync(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function formatWhen(ts: number): string {
  const date = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function statusKey(status: string): MessageKey {
  const key = `status_${status}` as MessageKey;
  return key in messages.zh ? key : "status_placed";
}

export function useScreen(): void {
  onShow(() => refreshDemo());
}

export function levelName(id: string): string {
  const level = demo.state.levels.find((item) => item.id === id);
  return level ? level.name[demo.locale] : id;
}
