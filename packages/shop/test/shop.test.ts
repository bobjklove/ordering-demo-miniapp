import { describe, expect, it } from "vitest";
import { makeCatalog, quoteCheckout } from "../../core/src/index";
import { messages } from "../src/i18n";
import { createInitialState } from "../src/initial";
import { shop } from "../src/shop";

describe("fictional shop config", () => {
  it("keeps unique ids and wires flash, group, and coupons to real products", () => {
    const ids = shop.products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    const categories = new Set(shop.categories.map((category) => category.id));
    for (const product of shop.products) expect(categories.has(product.categoryId)).toBe(true);
    expect(ids).toContain(shop.flash.productId);
    expect(ids).toContain(shop.groupCampaign.productId);
    expect(shop.name.zh).not.toMatch(/wechat|微信小程序官方/i);
    const state = createInitialState(1_700_000_000_000);
    expect(state.member.name).toBe("林阿禾");
    expect(state.member.registered).toBe(true);
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0].status).toBe("completed");
    expect(state.coupons.find((coupon) => coupon.kind === "birthday")?.used).toBe(false);
    expect(state.coupons.find((coupon) => coupon.kind === "newcomer")?.used).toBe(true);
    const catalog = makeCatalog(shop.products, state);
    expect(catalog.products).toHaveLength(shop.products.length);
    const { quote } = quoteCheckout(
      state,
      shop.products,
      {
        lines: [
          {
            lineId: "x",
            productId: "set-two",
            qty: 1,
            specIds: {},
            addonIds: [],
            pricing: "regular",
          },
        ],
        fulfillment: "pickup",
        couponId: "",
        redeemPoints: 0,
        useWallet: false,
      },
      1_700_000_000_000,
    );
    expect(quote.payable).toBe(4600);
    expect(quote.pointsEarn).toBe(Math.floor(46 * 1.2));
  });

  it("ships the same message keys in Chinese and English", () => {
    expect(Object.keys(messages.zh).sort()).toEqual(Object.keys(messages.en).sort());
  });
});