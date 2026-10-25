import type { KeyValue } from "./store";

/** Same-origin demo bus. Mini programs have no localStorage and keep their own copy. */
export function createBrowserKv(channelName: string): KeyValue | null {
  if (typeof localStorage === "undefined") return null;
  const listeners = new Set<() => void>();
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channelName) : null;
  const self = `tab-${Math.random().toString(36).slice(2)}`;
  const notify = () => listeners.forEach((handler) => handler());
  if (channel) {
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { from?: string } | null;
      if (data?.from === self) return;
      notify();
    };
  }
  const host = globalThis as typeof globalThis & {
    addEventListener?: (type: "storage", listener: () => void) => void;
  };
  host.addEventListener?.("storage", notify);
  return {
    read: (key) => localStorage.getItem(key),
    write: (key, value) => {
      localStorage.setItem(key, value);
      channel?.postMessage({ from: self, key });
    },
    subscribe: (handler) => {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}
