import { clone } from "./money";
import type { DemoState } from "./types";

export interface KeyValue {
  read(key: string): string | null;
  write(key: string, value: string): void;
  subscribe?(handler: () => void): () => void;
}

export interface Store {
  get(): DemoState;
  update(fn: (state: DemoState) => DemoState): DemoState;
  reset(next: DemoState): DemoState;
  subscribe(handler: (state: DemoState) => void): () => void;
}

export function hydrate(raw: string | null, seed: DemoState): DemoState {
  if (!raw) return clone(seed);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isState(parsed)) return clone(seed);
    return parsed;
  } catch {
    return clone(seed);
  }
}

function isState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoState>;
  return state.version === 1 && !!state.member && Array.isArray(state.orders) && Array.isArray(state.cart) && !!state.pointsRule && !!state.flash;
}

export function createMemoryKv(): KeyValue {
  const data = new Map<string, string>();
  const listeners = new Set<() => void>();
  return {
    read: (key) => data.get(key) ?? null,
    write: (key, value) => {
      data.set(key, value);
      listeners.forEach((handler) => handler());
    },
    subscribe: (handler) => {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}

export function createStore(options: { key: string; seed: DemoState; kv: KeyValue }): Store {
  let state = hydrate(options.kv.read(options.key), options.seed);
  const listeners = new Set<(next: DemoState) => void>();
  let mute = false;
  options.kv.subscribe?.(() => {
    if (mute) return;
    state = hydrate(options.kv.read(options.key), state);
    emit();
  });
  if (options.kv.read(options.key) == null) {
    mute = true;
    options.kv.write(options.key, JSON.stringify(state));
    mute = false;
  }

  function emit(): void {
    listeners.forEach((handler) => handler(state));
  }

  function commit(next: DemoState): DemoState {
    state = clone(next);
    mute = true;
    options.kv.write(options.key, JSON.stringify(state));
    mute = false;
    emit();
    return state;
  }

  return {
    get: () => state,
    update: (fn) => commit(fn(clone(state))),
    reset: (next) => commit(next),
    subscribe: (handler) => {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}
