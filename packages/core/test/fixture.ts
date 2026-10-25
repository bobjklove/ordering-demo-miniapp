import type { CartLine, DemoState, Product, Sellable } from "../src/index";

export const rule = {
  pointsPerUnit: 1,
  redeemPoints: 100,
  redeemCents: 100,
  maxRedeemRatio: 0.5,
};

export const levels = [
  { id: "sprout", name: { zh: "茶芽", en: "Sprout" }, minPoints: 0, multiplier: 1 },
  { id: "regular", name: { zh: "常客", en: "Regular" }, minPoints: 300, multiplier: 1.2 },
  { id: "house", name: { zh: "南风卡", en: "House" }, minPoints: 1200, multiplier: 1.5 },
];

export function drink(): Sellable {
  return {
    id: "tea",
    categoryId: "tea",
    name: { zh: "珍珠鲜奶", en: "Pearl milk" },
    desc: { zh: "测试饮品", en: "Test drink" },
    price: 1700,
    emoji: "🧋",
    tone: "#E7C8A0",
    onShelf: true,
    soldOut: false,
    specs: [
      {
        id: "size",
        name: { zh: "杯型", en: "Size" },
        required: true,
        options: [
          { id: "m", name: { zh: "中杯", en: "Medium" }, priceDelta: 0 },
          { id: "l", name: { zh: "大杯", en: "Large" }, priceDelta: 300 },
        ],
      },
      {
        id: "sweet",
        name: { zh: "甜度", en: "Sweetness" },
        required: true,
        options: [
          { id: "0", name: { zh: "无糖", en: "No sugar" }, priceDelta: 0 },
          { id: "50", name: { zh: "五分", en: "Half" }, priceDelta: 0 },
        ],
      },
      {
        id: "ice",
        name: { zh: "冰度", en: "Ice" },
        required: true,
        options: [
          { id: "normal", name: { zh: "正常冰", en: "Regular ice" }, priceDelta: 0 },
          { id: "none", name: { zh: "去冰", en: "No ice" }, priceDelta: 0 },
        ],
      },
    ],
    addons: [
      { id: "pearl", name: { zh: "珍珠", en: "Tapioca" }, price: 200 },
      { id: "foam", name: { zh: "奶盖", en: "Cheese foam" }, price: 400 },
    ],
  };
}

export function plain(): Sellable {
  return {
    id: "set",
    categoryId: "sets",
    name: { zh: "双人套", en: "Set for two" },
    desc: { zh: "无规格", en: "No specs" },
    price: 4600,
    emoji: "🧺",
    tone: "#E3B15A",
    onShelf: true,
    soldOut: false,
    specs: [],
    addons: [],
  };
}

export function asProduct(item: Sellable): Product {
  const { onShelf, soldOut, ...product } = item;
  void onShelf;
  void soldOut;
  return product;
}

export function line(partial: Partial<CartLine> & Pick<CartLine, "productId">): CartLine {
  return {
    lineId: partial.lineId ?? "pending",
    productId: partial.productId,
    qty: partial.qty ?? 1,
    specIds: partial.specIds ?? {},
    addonIds: partial.addonIds ?? [],
    pricing: partial.pricing ?? "regular",
  };
}

export function state(partial: Partial<DemoState> = {}): DemoState {
  const base: DemoState = {
    version: 1,
    cart: [],
    productOverrides: {},
    specDeltas: {},
    member: {
      id: "m-ahe",
      name: "林阿禾",
      phone: "555-****-0101",
      birthday: "03-18",
      points: 400,
      lifetimePoints: 1160,
      lifetimeSpend: 28600,
      walletBalance: 2500,
      ordersCount: 1,
      registered: true,
      receipt: null,
    },
    directory: [],
    coupons: [
      {
        id: "c-threshold",
        templateId: "threshold",
        name: { zh: "满减券", en: "Spend-and-save" },
        kind: "threshold",
        amountOff: 500,
        minSpend: 3000,
        expiresAt: 1_893_456_000_000,
        used: false,
        memberId: "m-ahe",
      },
    ],
    orders: [],
    groups: [],
    groupCampaign: { id: "g1", productId: "set", price: 1600, need: 2, active: true },
    flash: { id: "f1", productId: "tea", price: 1300, stockLeft: 20, active: true, endsAt: 1_893_456_000_000 },
    pointsRule: rule,
    levels,
    nextPickup: 24,
    pendingTable: "",
    shareClaimed: false,
    deliveryFee: 0,
    pickupPrefix: "A",
  };
  return { ...base, ...partial, member: { ...base.member, ...partial.member } };
}
