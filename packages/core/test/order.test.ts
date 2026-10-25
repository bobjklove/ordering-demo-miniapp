import { describe, expect, it } from "vitest";
import { DemoError } from "../src/errors";
import { formatPickup, normalizeTable, transition } from "../src/order";

describe("order state machine", () => {
  it("walks placed → preparing → ready → completed", () => {
    expect(transition("placed", "accept")).toBe("preparing");
    expect(transition("preparing", "ready")).toBe("ready");
    expect(transition("ready", "complete")).toBe("completed");
  });

  it("rejects skipping a step and cancelling a finished order", () => {
    expect(() => transition("placed", "ready")).toThrow(DemoError);
    expect(() => transition("placed", "complete")).toThrow(DemoError);
    expect(() => transition("ready", "cancel")).toThrow(DemoError);
    expect(() => transition("completed", "cancel")).toThrow(DemoError);
    expect(() => transition("cancelled", "accept")).toThrow(DemoError);
  });

  it("allows cancel only before the order is ready", () => {
    expect(transition("placed", "cancel")).toBe("cancelled");
    expect(transition("preparing", "cancel")).toBe("cancelled");
  });

  it("formats pickup numbers and table codes", () => {
    expect(formatPickup(24, "A")).toBe("A024");
    expect(normalizeTable(" t12 ")).toBe("T12");
    expect(normalizeTable("8")).toBe("8");
    expect(normalizeTable("kitchen")).toBeNull();
  });
});
