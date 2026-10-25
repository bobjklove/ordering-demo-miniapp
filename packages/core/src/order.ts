import { DemoError, fail } from "./errors";
import type { OrderAction, OrderStatus } from "./types";

const NEXT: Record<OrderAction, { from: OrderStatus[]; to: OrderStatus }> = {
  accept: { from: ["placed"], to: "preparing" },
  ready: { from: ["preparing"], to: "ready" },
  complete: { from: ["ready"], to: "completed" },
  cancel: { from: ["placed", "preparing"], to: "cancelled" },
};

export function transition(status: OrderStatus, action: OrderAction): OrderStatus {
  const step = NEXT[action];
  if (!step.from.includes(status)) fail("bad_transition");
  return step.to;
}

export function assertTransition(status: OrderStatus, action: OrderAction): void {
  try {
    transition(status, action);
  } catch (error) {
    if (error instanceof DemoError) throw error;
    fail("bad_transition");
  }
}

export function formatPickup(n: number, prefix = "A"): string {
  return `${prefix}${String(n).padStart(3, "0")}`;
}

export function normalizeTable(code: string): string | null {
  const value = code.trim().toUpperCase();
  if (!/^[A-Z]{0,2}\d{1,4}$/.test(value)) return null;
  return value;
}

export function pickupSlots(now: number): string[] {
  const slots = ["ASAP"];
  const start = new Date(now);
  const minutes = start.getMinutes();
  const add = (15 - (minutes % 15)) % 15;
  start.setMinutes(minutes + add, 0, 0);
  if (start.getTime() <= now) start.setMinutes(start.getMinutes() + 15);
  for (let i = 0; i < 4; i += 1) {
    const when = new Date(start.getTime() + i * 15 * 60 * 1000);
    slots.push(`${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`);
  }
  return slots;
}
