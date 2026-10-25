import { describe, expect, it } from "vitest";
import { incomingPlacedOrders } from "../src/notify";

describe("incoming order alerts", () => {
  const orders = [
    { id: "old", status: "completed" },
    { id: "open", status: "preparing" },
    { id: "fresh", status: "placed" },
    { id: "also", status: "placed" },
  ];

  it("alerts only for new orders that are still placed", () => {
    const known = new Set(["old", "open"]);
    expect(incomingPlacedOrders(known, orders)).toEqual(["fresh", "also"]);
  });

  it("stays quiet once those orders are known, even if another status arrives", () => {
    const known = new Set(["old", "open", "fresh", "also"]);
    expect(incomingPlacedOrders(known, orders)).toEqual([]);
    expect(incomingPlacedOrders(known, [{ id: "later", status: "ready" }])).toEqual([]);
  });

  it("does not alert for an order that is new but already past placed", () => {
    expect(incomingPlacedOrders(new Set(), [{ id: "seed", status: "completed" }])).toEqual([]);
  });
});
