import { describe, expect, it } from "vitest";
import { addToCart } from "../src/cart";
import { DemoError } from "../src/errors";
import {
  applyOrderAction,
  cancelOrder,
  claimShare,
  liveDashboard,
  mockFriendJoin,
  placePaidOrder,
  quoteCheckout,
  startGroup,
  topUp,
} from "../src/flow";
import { createMemoryKv, createStore, hydrate } from "../src/store";
import { asProduct, drink, line, plain, state } from "./fixture";

const now = new Date(2026, 5, 2, 15, 0, 0).getTime();
const products = [asProduct(drink()), asProduct(plain())];

function teaLine(qty = 2) {
  return line({
    productId: "tea",
    qty,
    specIds: { size: "l", sweet: "50", ice: "none" },
    addonIds: ["pearl", "foam"],
    pricing: "regular",
  });
}

describe("paid order flow", () => {
  it("prices add-ons, applies a coupon and points, then pays the rest from stored value", () => {
    const current = state();
    const { quote } = quoteCheckout(
      current,
      products,
      { lines: [teaLine()], fulfillment: "pickup", couponId: "c-threshold", redeemPoints: 100, useWallet: true },
      now,
    );
    expect(quote.subtotal).toBe(5200);
    expect(quote.discount).toBe(500);
    expect(quote.pointsRedeemed).toBe(100);
    expect(quote.pointsValue).toBe(100);
    expect(quote.walletApplied).toBe(2500);
    expect(quote.payable).toBe(2100);
    expect(quote.payMethod).toBe("mixed");
    expect(quote.pointsEarn).toBe(Math.floor(46 * 1.2));

    const placed = placePaidOrder(
      current,
      products,
      {
        lines: [teaLine()],
        fulfillment: "pickup",
        tableCode: "",
        deliveryAddress: "",
        note: "少冰已经选过",
        pickupTime: "ASAP",
        couponId: "c-threshold",
        redeemPoints: 100,
        useWallet: true,
        receipt: { kind: "personal", title: "个人", name: "林阿禾", email: "ahe@example.com", taxId: "" },
      },
      now,
      { orderId: "ord-1" },
    );
    expect(placed.order.status).toBe("placed");
    expect(placed.order.pickupNo).toBe("A024");
    expect(placed.order.pointsEarned).toBe(55);
    expect(placed.state.member.points).toBe(400 - 100 + 55);
    expect(placed.state.member.lifetimePoints).toBe(1160 + 55);
    expect(placed.state.member.walletBalance).toBe(0);
    expect(placed.order.levelBefore).toBe("regular");
    expect(placed.order.levelAfter).toBe("house");
    expect(placed.state.coupons[0].used).toBe(true);
    expect(placed.state.cart).toEqual([]);
    expect(placed.state.nextPickup).toBe(25);

    const preparing = applyOrderAction(placed.state, "ord-1", "accept");
    const ready = applyOrderAction(preparing, "ord-1", "ready");
    const done = applyOrderAction(ready, "ord-1", "complete");
    expect(done.orders[0].status).toBe("completed");
    expect(() => applyOrderAction(done, "ord-1", "cancel")).toThrow(DemoError);
  });

  it("refunds points, wallet, coupon, and flash stock when the kitchen has not finished", () => {
    let current = state({
      flash: { id: "f1", productId: "tea", price: 1300, stockLeft: 3, active: true, endsAt: now + 60_000 },
    });
    const flashLine = line({
      productId: "tea",
      qty: 2,
      specIds: { size: "m", sweet: "0", ice: "normal" },
      addonIds: [],
      pricing: "flash",
    });
    const placed = placePaidOrder(
      current,
      products,
      {
        lines: [flashLine],
        fulfillment: "dinein",
        tableCode: "t3",
        deliveryAddress: "",
        note: "",
        pickupTime: "12:00",
        couponId: "",
        redeemPoints: 0,
        useWallet: false,
        receipt: null,
      },
      now,
      { orderId: "ord-flash" },
    );
    expect(placed.order.tableCode).toBe("T3");
    expect(placed.order.lines[0].unitPrice).toBe(1300);
    expect(placed.state.flash.stockLeft).toBe(1);
    const cancelled = cancelOrder(placed.state, "ord-flash");
    expect(cancelled.orders[0].status).toBe("cancelled");
    expect(cancelled.flash.stockLeft).toBe(3);
    expect(cancelled.member.points).toBe(current.member.points);
    expect(cancelled.member.lifetimePoints).toBe(current.member.lifetimePoints);
  });

  it("uses the group price only after the mocked group succeeds", () => {
    let current = state();
    current = startGroup(current, now, "grp-1");
    expect(current.groups[0].status).toBe("open");
    const early = line({ productId: "set", pricing: "group" });
    expect(() => quoteCheckout(current, products, { lines: [early], fulfillment: "pickup", couponId: "", redeemPoints: 0, useWallet: false }, now)).toThrow(
      DemoError,
    );
    current = mockFriendJoin(current, "grp-1");
    expect(current.groups[0].status).toBe("success");
    const { quote } = quoteCheckout(
      current,
      products,
      { lines: [early], fulfillment: "pickup", couponId: "", redeemPoints: 0, useWallet: false },
      now,
    );
    expect(quote.subtotal).toBe(1600);
    expect(quote.payable).toBe(1600);
  });

  it("adds stored-value bonus and grants the share coupon once", () => {
    const topped = topUp(state(), { pay: 10000, bonus: 800 });
    expect(topped.member.walletBalance).toBe(2500 + 10800);
    const template = {
      id: "share",
      kind: "share" as const,
      name: { zh: "分享券", en: "Share coupon" },
      amountOff: 200,
      minSpend: 1500,
      daysValid: 14,
    };
    const once = claimShare(state(), template, now, "c-share");
    const twice = claimShare(once, template, now, "c-share-2");
    expect(once.coupons.some((coupon) => coupon.id === "c-share")).toBe(true);
    expect(twice.coupons.filter((coupon) => coupon.kind === "share")).toHaveLength(1);
  });

  it("rejects dine-in without a table and a guest who is not registered", () => {
    const input = {
      lines: [line({ productId: "set" })],
      fulfillment: "dinein" as const,
      tableCode: "",
      deliveryAddress: "",
      note: "",
      pickupTime: "ASAP",
      couponId: "",
      redeemPoints: 0,
      useWallet: false,
      receipt: null,
    };
    expect(() => placePaidOrder(state(), products, input, now, { orderId: "x" })).toThrow(DemoError);
    expect(() =>
      placePaidOrder(state({ member: { ...state().member, registered: false } }), products, { ...input, fulfillment: "pickup" }, now, {
        orderId: "y",
      }),
    ).toThrow(DemoError);
  });

  it("shares one paid order across two in-memory clients", () => {
    const kv = createMemoryKv();
    const seed = state();
    const customer = createStore({ key: "demo", seed, kv });
    const admin = createStore({ key: "demo", seed, kv });
    customer.update((current) => {
      const cart = addToCart(current.cart, {
        productId: "set",
        qty: 1,
        specIds: {},
        addonIds: [],
        pricing: "regular",
      });
      return { ...current, cart };
    });
    const paid = placePaidOrder(
      customer.get(),
      products,
      {
        lines: customer.get().cart,
        fulfillment: "delivery",
        tableCode: "",
        deliveryAddress: "示范港海港巷 18 号",
        note: "放门口",
        pickupTime: "ASAP",
        couponId: "",
        redeemPoints: 0,
        useWallet: false,
        receipt: null,
      },
      now,
      { orderId: "ord-sync" },
    );
    customer.reset(paid.state);
    expect(admin.get().orders[0].id).toBe("ord-sync");
    expect(admin.get().orders[0].status).toBe("placed");
    admin.update((current) => applyOrderAction(current, "ord-sync", "accept"));
    expect(customer.get().orders[0].status).toBe("preparing");
  });

  it("falls back when stored JSON is unusable and adds live orders onto the dashboard baseline", () => {
    const seed = state();
    expect(hydrate("{", seed).member.name).toBe("林阿禾");
    expect(hydrate(JSON.stringify({ version: 1 }), seed).orders).toEqual([]);
    const summary = liveDashboard(
      { todayOrders: 36, todayRevenue: 128400, repurchaseRate: 0.37, hot: [{ productId: "tea", count: 4 }] },
      [
        {
          ...placePaidOrder(
            state(),
            products,
            {
              lines: [line({ productId: "set", qty: 1 })],
              fulfillment: "pickup",
              tableCode: "",
              deliveryAddress: "",
              note: "",
              pickupTime: "ASAP",
              couponId: "",
              redeemPoints: 0,
              useWallet: false,
              receipt: null,
            },
            now,
            { orderId: "ord-dash" },
          ).order,
        },
      ],
      now,
    );
    expect(summary.orders).toBe(37);
    expect(summary.revenue).toBe(128400 + 4600);
    expect(summary.hot.find((item) => item.productId === "set")?.count).toBe(1);
    expect(summary.repurchaseRate).toBe(0.37);
  });
});
