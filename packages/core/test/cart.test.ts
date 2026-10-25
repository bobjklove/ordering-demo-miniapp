import { describe, expect, it } from "vitest";
import { addToCart, priceLine, unitPrice } from "../src/cart";
import { DemoError } from "../src/errors";
import { makeCatalog } from "../src/catalog";
import { asProduct, drink, line, plain, state } from "./fixture";

describe("cart pricing with add-ons", () => {
  it("adds size delta and each add-on, then multiplies by quantity", () => {
    const products = [asProduct(drink())];
    const catalog = makeCatalog(products, state());
    const item = line({
      productId: "tea",
      qty: 2,
      specIds: { size: "l", sweet: "50", ice: "none" },
      addonIds: ["pearl", "foam"],
    });
    // 17.00 base + 3.00 large + 2.00 tapioca + 4.00 foam = 26.00, times 2
    expect(unitPrice(catalog.products[0], item, catalog)).toBe(2600);
    const priced = priceLine(catalog, { ...item, lineId: "x" });
    expect(priced.lineTotal).toBe(5200);
    expect(priced.specSummary.zh).toContain("大杯");
    expect(priced.specSummary.zh).toContain("五分");
    expect(priced.addonSummary.en).toContain("Tapioca");
    expect(priced.addonSummary.en).toContain("Cheese foam");
  });

  it("merges an identical spec and add-on combination", () => {
    const first = addToCart([], {
      productId: "tea",
      qty: 1,
      specIds: { size: "m", sweet: "0", ice: "normal" },
      addonIds: ["foam", "pearl"],
      pricing: "regular",
    });
    const second = addToCart(first, {
      productId: "tea",
      qty: 2,
      specIds: { size: "m", sweet: "0", ice: "normal" },
      addonIds: ["pearl", "foam"],
      pricing: "regular",
    });
    expect(second).toHaveLength(1);
    expect(second[0].qty).toBe(3);
  });

  it("keeps a different sweetness as a separate line", () => {
    let cart = addToCart([], {
      productId: "tea",
      qty: 1,
      specIds: { sweet: "0" },
      addonIds: [],
      pricing: "regular",
    });
    cart = addToCart(cart, {
      productId: "tea",
      qty: 1,
      specIds: { sweet: "50" },
      addonIds: [],
      pricing: "regular",
    });
    expect(cart).toHaveLength(2);
  });

  it("rejects a missing required spec, an unknown add-on, and a sold-out item", () => {
    const products = [asProduct(drink())];
    const catalog = makeCatalog(products, state());
    expect(() =>
      priceLine(catalog, line({ productId: "tea", specIds: { size: "l", ice: "none" }, addonIds: [] })),
    ).toThrow(DemoError);
    expect(() =>
      priceLine(
        catalog,
        line({ productId: "tea", specIds: { size: "m", sweet: "0", ice: "normal" }, addonIds: ["nope"] }),
      ),
    ).toThrow(DemoError);
    const sold = makeCatalog(products, state({ productOverrides: { tea: { soldOut: true } } }));
    expect(() =>
      priceLine(sold, line({ productId: "tea", specIds: { size: "m", sweet: "0", ice: "normal" } })),
    ).toThrow(DemoError);
    expect(plain().price).toBe(4600);
  });
});
