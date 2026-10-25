import { fail } from "./errors";
import type { CartLine, Catalog, Localized, PricedLine, PricingMode, Product, Sellable } from "./types";

export function lineKey(input: {
  productId: string;
  specIds: Record<string, string>;
  addonIds: string[];
  pricing: PricingMode;
}): string {
  const specs = Object.keys(input.specIds)
    .sort()
    .map((key) => `${key}:${input.specIds[key]}`)
    .join(",");
  const addons = [...input.addonIds].sort().join(",");
  return `${input.pricing}|${input.productId}|${specs}|${addons}`;
}

export function addToCart(cart: CartLine[], input: Omit<CartLine, "lineId">): CartLine[] {
  if (!Number.isInteger(input.qty) || input.qty <= 0) fail("bad_qty");
  const specIds = { ...input.specIds };
  const addonIds = [...input.addonIds].sort();
  const lineId = lineKey({ ...input, specIds, addonIds });
  const existing = cart.find((line) => line.lineId === lineId);
  if (existing) {
    return cart.map((line) => (line.lineId === lineId ? { ...line, qty: line.qty + input.qty } : line));
  }
  return [...cart, { ...input, specIds, addonIds, lineId }];
}

export function setQty(cart: CartLine[], lineId: string, qty: number): CartLine[] {
  if (!Number.isInteger(qty)) fail("bad_qty");
  if (qty <= 0) return cart.filter((line) => line.lineId !== lineId);
  return cart.map((line) => (line.lineId === lineId ? { ...line, qty } : line));
}

export function defaultSpecs(product: Product): Record<string, string> {
  const specIds: Record<string, string> = {};
  for (const group of product.specs) {
    const first = group.options[0];
    if (first) specIds[group.id] = first.id;
  }
  return specIds;
}

function joinLocalized(parts: Localized[], sep: string): Localized {
  return {
    zh: parts.map((part) => part.zh).filter(Boolean).join(sep),
    en: parts.map((part) => part.en).filter(Boolean).join(sep),
  };
}

export function findSellable(catalog: Catalog, productId: string): Sellable {
  const product = catalog.products.find((item) => item.id === productId);
  if (!product) fail("unknown_product");
  return product;
}

export function unitPrice(product: Sellable, line: Pick<CartLine, "specIds" | "addonIds" | "pricing">, catalog: Catalog): number {
  if (!product.onShelf) fail("off_shelf");
  if (product.soldOut) fail("sold_out");
  let base = product.price;
  if (line.pricing === "flash") {
    if (!catalog.flash || !catalog.flash.active || catalog.flash.productId !== product.id) fail("flash_inactive");
    base = catalog.flash.price;
  } else if (line.pricing === "group") {
    if (!catalog.group || !catalog.group.unlocked || catalog.group.productId !== product.id) fail("group_inactive");
    base = catalog.group.price;
  }
  let extra = 0;
  for (const group of product.specs) {
    const selected = line.specIds[group.id];
    const option = group.options.find((item) => item.id === selected);
    if (group.required && !option) fail("missing_spec");
    if (selected && !option) fail("missing_spec");
    if (option) extra += option.priceDelta;
  }
  for (const addonId of line.addonIds) {
    const addon = product.addons.find((item) => item.id === addonId);
    if (!addon) fail("missing_spec");
    extra += addon.price;
  }
  const unit = base + extra;
  if (!Number.isInteger(unit) || unit < 0) fail("bad_price");
  return unit;
}

export function priceLine(catalog: Catalog, line: CartLine): PricedLine {
  if (!Number.isInteger(line.qty) || line.qty <= 0) fail("bad_qty");
  const product = findSellable(catalog, line.productId);
  const unit = unitPrice(product, line, catalog);
  const specParts: Localized[] = [];
  for (const group of product.specs) {
    const option = group.options.find((item) => item.id === line.specIds[group.id]);
    if (option) specParts.push(option.name);
  }
  const addonParts = line.addonIds
    .map((id) => product.addons.find((item) => item.id === id)?.name)
    .filter((name): name is Localized => Boolean(name));
  return {
    ...line,
    specIds: { ...line.specIds },
    addonIds: [...line.addonIds],
    name: product.name,
    unitPrice: unit,
    lineTotal: unit * line.qty,
    specSummary: joinLocalized(specParts, " / "),
    addonSummary: joinLocalized(addonParts, " / "),
  };
}

export function subtotalOf(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}
