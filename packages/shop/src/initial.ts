import {
  defaultSpecs,
  formatPickup,
  type Coupon,
  type DemoState,
  type Order,
  type Product,
} from "@demo/core";
import { shop } from "./shop";

function specSummary(product: Product): { zh: string; en: string } {
  const specs = defaultSpecs(product);
  const zh: string[] = [];
  const en: string[] = [];
  for (const group of product.specs) {
    const option = group.options.find((item) => item.id === specs[group.id]);
    if (!option) continue;
    zh.push(option.name.zh);
    en.push(option.name.en);
  }
  return { zh: zh.join(" / "), en: en.join(" / ") };
}

function seedOrder(now: number): Order {
  const product = shop.products.find((item) => item.id === "jasmine") ?? shop.products[0];
  const specs = defaultSpecs(product);
  return {
    id: "ord-seed-jasmine",
    pickupNo: formatPickup(shop.demoMember.ordersCount === 1 ? 23 : 23, "A"),
    createdAt: now - 36 * 60 * 60 * 1000,
    status: "completed",
    fulfillment: "pickup",
    tableCode: "",
    deliveryAddress: "",
    note: "",
    pickupTime: "ASAP",
    lines: [
      {
        lineId: `regular|${product.id}|seed`,
        productId: product.id,
        qty: 1,
        specIds: specs,
        addonIds: [],
        pricing: "regular",
        name: product.name,
        unitPrice: product.price,
        lineTotal: product.price,
        specSummary: specSummary(product),
        addonSummary: { zh: "", en: "" },
      },
    ],
    subtotal: product.price,
    deliveryFee: 0,
    discount: 0,
    couponId: "",
    pointsRedeemed: 0,
    pointsValue: 0,
    walletApplied: 0,
    payable: product.price,
    payMethod: "mock-wechat",
    pointsEarned: Math.floor(product.price / 100),
    levelBefore: "regular",
    levelAfter: "regular",
    memberId: shop.demoMember.id,
    receipt: { ...shop.seedReceipt },
  };
}

function coupon(templateId: string, id: string, used: boolean, now: number): Coupon {
  const template = shop.couponTemplates.find((item) => item.id === templateId);
  if (!template) throw new Error(`missing template ${templateId}`);
  return {
    id,
    templateId: template.id,
    name: template.name,
    kind: template.kind,
    amountOff: template.amountOff,
    minSpend: template.minSpend,
    expiresAt: now + template.daysValid * 86_400_000,
    used,
    memberId: shop.demoMember.id,
  };
}

export function createInitialState(now = Date.now()): DemoState {
  return {
    version: 1,
    cart: [],
    productOverrides: {},
    specDeltas: {},
    member: {
      ...shop.demoMember,
      registered: true,
      receipt: { ...shop.seedReceipt },
    },
    directory: shop.directory.map((entry) => ({ ...entry, note: { ...entry.note } })),
    coupons: [
      coupon("newcomer", "c-newcomer", true, now),
      coupon("threshold", "c-threshold", false, now),
      coupon("birthday", "c-birthday", false, now),
    ],
    orders: [seedOrder(now)],
    groups: [],
    groupCampaign: { ...shop.groupCampaign },
    flash: {
      id: shop.flash.id,
      productId: shop.flash.productId,
      price: shop.flash.price,
      stockLeft: shop.flash.stock,
      active: true,
      endsAt: now + shop.flashDurationMs,
    },
    pointsRule: { ...shop.pointsRule },
    levels: shop.levels.map((level) => ({ ...level, name: { ...level.name } })),
    nextPickup: 24,
    pendingTable: "",
    shareClaimed: false,
    deliveryFee: shop.deliveryFee,
    pickupPrefix: shop.pickupPrefix,
  };
}
